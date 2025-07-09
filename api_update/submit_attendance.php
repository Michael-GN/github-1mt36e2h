<?php
require_once 'config.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $required_fields = ['session_id', 'student_id', 'is_present', 'timestamp'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Extract data
    $session_id = $input['session_id'];
    $student_id = $input['student_id'];
    $is_present = (int)$input['is_present'];
    $timestamp = $input['timestamp'];
    $course_title = $input['course_title'] ?? '';
    $course_code = $input['course_code'] ?? '';
    $field_name = $input['field_name'] ?? '';
    $level = $input['level'] ?? '';
    $room = $input['room'] ?? '';
    $lecturer = $input['lecturer'] ?? '';
    $date = $input['date'] ?? date('Y-m-d');

    // Check if attendance record already exists for this student, session, and date
    $check_stmt = $pdo->prepare("
        SELECT id FROM attendance 
        WHERE session_id = :session_id 
            AND student_id = :student_id 
            AND DATE(timestamp) = :date
    ");
    $check_stmt->execute([
        ':session_id' => $session_id,
        ':student_id' => $student_id,
        ':date' => $date
    ]);

    if ($check_stmt->fetch()) {
        // Update existing record
        $update_stmt = $pdo->prepare("
            UPDATE attendance SET 
                is_present = :is_present,
                timestamp = :timestamp,
                course_title = :course_title,
                course_code = :course_code,
                field_name = :field_name,
                level = :level,
                room = :room,
                lecturer = :lecturer
            WHERE session_id = :session_id 
                AND student_id = :student_id 
                AND DATE(timestamp) = :date
        ");
        
        $update_stmt->execute([
            ':is_present' => $is_present,
            ':timestamp' => $timestamp,
            ':course_title' => $course_title,
            ':course_code' => $course_code,
            ':field_name' => $field_name,
            ':level' => $level,
            ':room' => $room,
            ':lecturer' => $lecturer,
            ':session_id' => $session_id,
            ':student_id' => $student_id,
            ':date' => $date
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Attendance record updated successfully',
            'action' => 'updated'
        ]);
    } else {
        // Insert new record
        $insert_stmt = $pdo->prepare("
            INSERT INTO attendance (
                session_id, student_id, is_present, timestamp, 
                course_title, course_code, field_name, level, 
                room, lecturer
            ) VALUES (
                :session_id, :student_id, :is_present, :timestamp,
                :course_title, :course_code, :field_name, :level,
                :room, :lecturer
            )
        ");
        
        $insert_stmt->execute([
            ':session_id' => $session_id,
            ':student_id' => $student_id,
            ':is_present' => $is_present,
            ':timestamp' => $timestamp,
            ':course_title' => $course_title,
            ':course_code' => $course_code,
            ':field_name' => $field_name,
            ':level' => $level,
            ':room' => $room,
            ':lecturer' => $lecturer
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Attendance record saved successfully',
            'action' => 'inserted',
            'id' => $pdo->lastInsertId()
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to submit attendance: ' . $e->getMessage()
    ]);
}
?>