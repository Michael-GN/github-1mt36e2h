<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database connection
$host = 'localhost';
$dbname = 'rollcall_system';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

try {
    // Get parameters
    $report_type = $_GET['report_type'] ?? 'daily';
    $date_from = $_GET['date_from'] ?? date('Y-m-d');
    $date_to = $_GET['date_to'] ?? date('Y-m-d');
    
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

    // Get field attendance summary
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
            AND DATE(a.timestamp) BETWEEN ? AND ?
        GROUP BY s.field 
        ORDER BY attendanceRate DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$date_from, $date_to]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch field attendance summary']);
}
?>