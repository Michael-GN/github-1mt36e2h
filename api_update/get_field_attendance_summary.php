<?php
require_once 'config.php';

try {
    // Get filter parameters
    $report_type = $_GET['report_type'] ?? 'daily';
    $date_from = $_GET['date_from'] ?? date('Y-m-d');
    $date_to = $_GET['date_to'] ?? date('Y-m-d');
    $field = $_GET['field'] ?? '';
    $level = $_GET['level'] ?? '';
    $course = $_GET['course'] ?? '';

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

    // Build the query
    $sql = "
        SELECT 
            s.field as fieldName,
            COUNT(DISTINCT s.id) as totalStudents,
            COALESCE(SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END), 0) as presentCount,
            COALESCE(SUM(CASE WHEN a.is_present = 0 THEN 1 ELSE 0 END), 0) as absentCount,
            CASE 
                WHEN COUNT(a.id) > 0 THEN 
                    ROUND((SUM(CASE WHEN a.is_present = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id)), 2)
                ELSE 100.0 
            END as attendanceRate
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id 
            AND DATE(a.timestamp) BETWEEN :date_from AND :date_to
    ";

    $params = [
        ':date_from' => $date_from,
        ':date_to' => $date_to
    ];

    // Add field filter if specified
    if (!empty($field)) {
        $sql .= " AND s.field = :field";
        $params[':field'] = $field;
    }

    // Add level filter if specified
    if (!empty($level)) {
        $sql .= " AND s.level = :level";
        $params[':level'] = $level;
    }

    $sql .= " GROUP BY s.field ORDER BY attendanceRate DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();

    // Add absentees array for each field
    foreach ($results as &$result) {
        $result['absentees'] = [];
        
        // Get absentees for this field
        $absentee_sql = "
            SELECT 
                a.id,
                s.name as studentName,
                s.matricule,
                s.field as fieldName,
                s.level,
                a.course_title as courseTitle,
                a.course_code as courseCode,
                s.parent_name as parentName,
                s.parent_phone as parentPhone,
                s.parent_email as parentEmail,
                a.timestamp as date,
                a.session_id as sessionId,
                CONCAT(TIME_FORMAT(TIME(a.timestamp), '%H:%i'), ' - ', 
                       TIME_FORMAT(ADDTIME(TIME(a.timestamp), '02:00:00'), '%H:%i')) as timeSlot
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.is_present = 0 
                AND s.field = :field_name
                AND DATE(a.timestamp) BETWEEN :date_from AND :date_to
        ";
        
        $absentee_params = [
            ':field_name' => $result['fieldName'],
            ':date_from' => $date_from,
            ':date_to' => $date_to
        ];

        if (!empty($level)) {
            $absentee_sql .= " AND s.level = :level";
            $absentee_params[':level'] = $level;
        }

        if (!empty($course)) {
            $absentee_sql .= " AND a.course_title LIKE :course";
            $absentee_params[':course'] = "%$course%";
        }

        $absentee_sql .= " ORDER BY a.timestamp DESC";

        $absentee_stmt = $pdo->prepare($absentee_sql);
        $absentee_stmt->execute($absentee_params);
        $result['absentees'] = $absentee_stmt->fetchAll();
    }

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch field attendance summary: ' . $e->getMessage()]);
}
?>