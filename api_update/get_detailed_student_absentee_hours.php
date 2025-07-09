<?php
require_once 'config.php';

try {
    // Get filter parameters
    $report_type = $_GET['report_type'] ?? 'monthly';
    $date_from = $_GET['date_from'] ?? date('Y-m-01');
    $date_to = $_GET['date_to'] ?? date('Y-m-t');
    $field = $_GET['field'] ?? '';
    $level = $_GET['level'] ?? '';

    // Set date range based on report type
    switch ($report_type) {
        case 'weekly':
            $date_from = date('Y-m-d', strtotime('monday this week'));
            $date_to = date('Y-m-d', strtotime('sunday this week'));
            break;
        case 'monthly':
            $date_from = date('Y-m-01');
            $date_to = date('Y-m-t');
            break;
        case 'daily':
            $date_from = $date_to = date('Y-m-d');
            break;
    }

    // Get detailed absentee hours for each student
    $sql = "
        SELECT 
            s.id as studentId,
            s.name as studentName,
            s.matricule,
            s.field,
            s.level,
            COUNT(a.id) * 2 as totalAbsentHours,
            GROUP_CONCAT(
                CONCAT(
                    COALESCE(a.course_title, 'Unknown Course'), '|',
                    DATE(a.timestamp), '|',
                    COALESCE(a.course_code, 'N/A'), '|',
                    '2', '|',
                    CONCAT(TIME_FORMAT(TIME(a.timestamp), '%H:%i'), ' - ', 
                           TIME_FORMAT(ADDTIME(TIME(a.timestamp), '02:00:00'), '%H:%i'))
                )
                ORDER BY a.timestamp DESC
                SEPARATOR ';'
            ) as absentSessionsData
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id 
            AND a.is_present = 0 
            AND DATE(a.timestamp) BETWEEN :date_from AND :date_to
    ";

    $params = [
        ':date_from' => $date_from,
        ':date_to' => $date_to
    ];

    // Add filters
    if (!empty($field)) {
        $sql .= " AND s.field = :field";
        $params[':field'] = $field;
    }

    if (!empty($level)) {
        $sql .= " AND s.level = :level";
        $params[':level'] = $level;
    }

    $sql .= " GROUP BY s.id, s.name, s.matricule, s.field, s.level ORDER BY totalAbsentHours DESC, s.name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();

    // Process the results to format absentSessions properly
    foreach ($results as &$result) {
        $result['absentSessions'] = [];
        
        if (!empty($result['absentSessionsData'])) {
            $sessions = explode(';', $result['absentSessionsData']);
            foreach ($sessions as $sessionData) {
                if (!empty($sessionData)) {
                    $parts = explode('|', $sessionData);
                    if (count($parts) >= 5) {
                        $result['absentSessions'][] = [
                            'course' => $parts[0],
                            'date' => $parts[1],
                            'courseCode' => $parts[2],
                            'duration' => (int)$parts[3],
                            'timeSlot' => $parts[4]
                        ];
                    }
                }
            }
        }
        
        // Remove the raw data field
        unset($result['absentSessionsData']);
    }

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch detailed student absentee hours: ' . $e->getMessage()]);
}
?>