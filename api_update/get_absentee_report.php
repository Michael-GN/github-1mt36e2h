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
    $student_name = $_GET['student_name'] ?? '';
    $matricule = $_GET['matricule'] ?? '';

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

    // Build the query for absentees only (is_present = 0)
    $sql = "
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

    if (!empty($course)) {
        $sql .= " AND a.course_title LIKE :course";
        $params[':course'] = "%$course%";
    }

    if (!empty($student_name)) {
        $sql .= " AND s.name LIKE :student_name";
        $params[':student_name'] = "%$student_name%";
    }

    if (!empty($matricule)) {
        $sql .= " AND s.matricule LIKE :matricule";
        $params[':matricule'] = "%$matricule%";
    }

    $sql .= " ORDER BY a.timestamp DESC, s.field, s.name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch absentee report: ' . $e->getMessage()]);
}
?>