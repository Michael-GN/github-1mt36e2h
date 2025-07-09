<?php
require_once 'config.php';

try {
    // Get basic counts
    $total_students_stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
    $total_students = $total_students_stmt->fetch()['count'];

    $total_fields_stmt = $pdo->query("SELECT COUNT(DISTINCT field) as count FROM students");
    $total_fields = $total_fields_stmt->fetch()['count'];

    // Get today's absentees
    $today_absentees_stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM attendance 
        WHERE is_present = 0 AND DATE(timestamp) = CURDATE()
    ");
    $today_absentees_stmt->execute();
    $today_absentees = $today_absentees_stmt->fetch()['count'];

    // Get weekly absentees
    $weekly_absentees_stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM attendance 
        WHERE is_present = 0 
            AND DATE(timestamp) BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) 
            AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 6 DAY)
    ");
    $weekly_absentees_stmt->execute();
    $weekly_absentees = $weekly_absentees_stmt->fetch()['count'];

    // Get monthly absentees
    $monthly_absentees_stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM attendance 
        WHERE is_present = 0 
            AND YEAR(timestamp) = YEAR(CURDATE()) 
            AND MONTH(timestamp) = MONTH(CURDATE())
    ");
    $monthly_absentees_stmt->execute();
    $monthly_absentees = $monthly_absentees_stmt->fetch()['count'];

    // Get field statistics
    $field_stats_stmt = $pdo->prepare("
        SELECT 
            s.field as fieldName,
            COUNT(DISTINCT s.id) as totalStudents,
            COALESCE(SUM(CASE WHEN a.is_present = 1 AND DATE(a.timestamp) = CURDATE() THEN 1 ELSE 0 END), 0) as presentToday,
            COALESCE(SUM(CASE WHEN a.is_present = 0 AND DATE(a.timestamp) = CURDATE() THEN 1 ELSE 0 END), 0) as absentToday,
            CASE 
                WHEN COUNT(CASE WHEN DATE(a.timestamp) = CURDATE() THEN 1 END) > 0 THEN
                    ROUND((SUM(CASE WHEN a.is_present = 1 AND DATE(a.timestamp) = CURDATE() THEN 1 ELSE 0 END) * 100.0 / 
                           COUNT(CASE WHEN DATE(a.timestamp) = CURDATE() THEN 1 END)), 2)
                ELSE 100.0
            END as attendanceRate
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        GROUP BY s.field
        ORDER BY attendanceRate DESC
    ");
    $field_stats_stmt->execute();
    $field_stats = $field_stats_stmt->fetchAll();

    // Get top absentee fields (fields with highest absentee rates today)
    $top_absentee_fields_stmt = $pdo->prepare("
        SELECT 
            s.field as fieldName,
            COUNT(DISTINCT s.id) as totalStudents,
            COALESCE(SUM(CASE WHEN a.is_present = 0 AND DATE(a.timestamp) = CURDATE() THEN 1 ELSE 0 END), 0) as absenteeCount,
            CASE 
                WHEN COUNT(CASE WHEN DATE(a.timestamp) = CURDATE() THEN 1 END) > 0 THEN
                    ROUND((SUM(CASE WHEN a.is_present = 0 AND DATE(a.timestamp) = CURDATE() THEN 1 ELSE 0 END) * 100.0 / 
                           COUNT(CASE WHEN DATE(a.timestamp) = CURDATE() THEN 1 END)), 2)
                ELSE 0.0
            END as absenteeRate
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        GROUP BY s.field
        HAVING absenteeCount > 0
        ORDER BY absenteeRate DESC, absenteeCount DESC
        LIMIT 5
    ");
    $top_absentee_fields_stmt->execute();
    $top_absentee_fields = $top_absentee_fields_stmt->fetchAll();

    // Prepare response
    $response = [
        'totalStudents' => (int)$total_students,
        'totalFields' => (int)$total_fields,
        'todayAbsentees' => (int)$today_absentees,
        'weeklyAbsentees' => (int)$weekly_absentees,
        'monthlyAbsentees' => (int)$monthly_absentees,
        'fieldStats' => array_map(function($stat) {
            return [
                'fieldName' => $stat['fieldName'],
                'totalStudents' => (int)$stat['totalStudents'],
                'presentToday' => (int)$stat['presentToday'],
                'absentToday' => (int)$stat['absentToday'],
                'attendanceRate' => (float)$stat['attendanceRate']
            ];
        }, $field_stats),
        'topAbsenteeFields' => array_map(function($field) {
            return [
                'fieldName' => $field['fieldName'],
                'totalStudents' => (int)$field['totalStudents'],
                'absenteeCount' => (int)$field['absenteeCount'],
                'absenteeRate' => (float)$field['absenteeRate']
            ];
        }, $top_absentee_fields)
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch dashboard stats: ' . $e->getMessage()]);
}
?>