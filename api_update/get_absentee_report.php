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
    $field = $_GET['field'] ?? '';
    $level = $_GET['level'] ?? '';
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

    // Build query for absentees only (is_present = 0)
    $sql = "
        SELECT 
            a.id,
            s.name as studentName,
            s.matricule,
            s.field as fieldName,
            s.level,
            COALESCE(a.course_title, 'Unknown Course') as courseTitle,
            COALESCE(a.course_code, 'N/A') as courseCode,
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
            AND DATE(a.timestamp) BETWEEN ? AND ?
    ";

    $params = [$date_from, $date_to];

    // Add filters
    if (!empty($field)) {
        $sql .= " AND s.field = ?";
        $params[] = $field;
    }

    if (!empty($level)) {
        $sql .= " AND s.level = ?";
        $params[] = $level;
    }

    if (!empty($student_name)) {
        $sql .= " AND s.name LIKE ?";
        $params[] = "%$student_name%";
    }

    if (!empty($matricule)) {
        $sql .= " AND s.matricule LIKE ?";
        $params[] = "%$matricule%";
    }

    $sql .= " ORDER BY a.timestamp DESC, s.field, s.name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($results);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch absentee report']);
}
?>