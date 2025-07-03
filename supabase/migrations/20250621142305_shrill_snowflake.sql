-- Rollcall Management System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS rollcall_system;
USE rollcall_system;

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    matricule VARCHAR(50) NOT NULL UNIQUE,
    field VARCHAR(100) NOT NULL,
    level ENUM('Level 100', 'Level 200') NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_field (field),
    INDEX idx_level (level),
    INDEX idx_matricule (matricule)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    field VARCHAR(100) NOT NULL,
    level ENUM('Level 100', 'Level 200') NOT NULL,
    lecturer VARCHAR(100) NOT NULL,
    credits INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_field_level (field, level)
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
    id INT PRIMARY KEY AUTO_INCREMENT,
    day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday') NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    course_id INT NOT NULL,
    room VARCHAR(50) NOT NULL,
    field VARCHAR(100) NOT NULL,
    level ENUM('Level 100', 'Level 200') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_slot (day, time_slot, field, level),
    INDEX idx_day_field (day, field)
);

-- Sessions table (for active rollcall sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(50) PRIMARY KEY,
    course_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50) NOT NULL,
    status ENUM('scheduled', 'active', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_date_status (date, status)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(50) NOT NULL,
    student_id INT NOT NULL,
    is_present BOOLEAN NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (session_id, student_id, DATE(timestamp)),
    INDEX idx_session_date (session_id, DATE(timestamp)),
    INDEX idx_student_date (student_id, DATE(timestamp))
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'Discipline Master',
    employee_id VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data

-- Fields
INSERT INTO fields (name, code, description) VALUES
('Computer Science', 'CS', 'Computer Science and Programming'),
('Software Engineering', 'SE', 'Software Development and Engineering'),
('Information Technology', 'IT', 'Information Technology and Systems'),
('Cybersecurity', 'CYB', 'Cybersecurity and Network Security'),
('Data Science', 'DS', 'Data Science and Analytics');

-- Sample courses
INSERT INTO courses (title, code, field, level, lecturer) VALUES
('Programming Fundamentals', 'CS101', 'Computer Science', 'Level 100', 'Dr. Smith'),
('Database Systems', 'CS201', 'Computer Science', 'Level 200', 'Prof. Johnson'),
('Software Engineering Principles', 'SE101', 'Software Engineering', 'Level 100', 'Dr. Wilson'),
('Advanced Software Architecture', 'SE201', 'Software Engineering', 'Level 200', 'Prof. Davis'),
('Web Development Basics', 'IT101', 'Information Technology', 'Level 100', 'Ms. Brown'),
('Network Administration', 'IT201', 'Information Technology', 'Level 200', 'Dr. Taylor'),
('Introduction to Cybersecurity', 'CYB101', 'Cybersecurity', 'Level 100', 'Prof. Anderson'),
('Ethical Hacking', 'CYB201', 'Cybersecurity', 'Level 200', 'Dr. Martinez'),
('Statistics for Data Science', 'DS101', 'Data Science', 'Level 100', 'Dr. Lee'),
('Machine Learning', 'DS201', 'Data Science', 'Level 200', 'Prof. Garcia');

-- Sample students
INSERT INTO students (name, matricule, field, level, parent_name, parent_phone, parent_email) VALUES
('Alice Johnson', 'CS200/001', 'Computer Science', 'Level 200', 'John Johnson', '+1234567890', 'john.johnson@email.com'),
('Bob Smith', 'SE200/002', 'Software Engineering', 'Level 200', 'Mary Smith', '+1234567891', 'mary.smith@email.com'),
('Carol Davis', 'IT100/003', 'Information Technology', 'Level 100', 'Robert Davis', '+1234567892', 'robert.davis@email.com'),
('David Wilson', 'CYB200/004', 'Cybersecurity', 'Level 200', 'Linda Wilson', '+1234567893', 'linda.wilson@email.com'),
('Emma Brown', 'DS100/005', 'Data Science', 'Level 100', 'Michael Brown', '+1234567894', 'michael.brown@email.com'),
('Frank Miller', 'CS100/006', 'Computer Science', 'Level 100', 'Susan Miller', '+1234567895', 'susan.miller@email.com'),
('Grace Lee', 'SE100/007', 'Software Engineering', 'Level 100', 'James Lee', '+1234567896', 'james.lee@email.com'),
('Henry Garcia', 'IT200/008', 'Information Technology', 'Level 200', 'Maria Garcia', '+1234567897', 'maria.garcia@email.com'),
('Ivy Martinez', 'CYB100/009', 'Cybersecurity', 'Level 100', 'Carlos Martinez', '+1234567898', 'carlos.martinez@email.com'),
('Jack Taylor', 'DS200/010', 'Data Science', 'Level 200', 'Lisa Taylor', '+1234567899', 'lisa.taylor@email.com');

-- Sample timetable entries
INSERT INTO timetable (day, time_slot, course_id, room, field, level) VALUES
('Monday', '08:00 - 10:00', 2, 'Lab 101', 'Computer Science', 'Level 200'),
('Monday', '10:00 - 12:00', 1, 'Room 205', 'Computer Science', 'Level 100'),
('Tuesday', '08:00 - 10:00', 4, 'Room 103', 'Software Engineering', 'Level 200'),
('Tuesday', '14:00 - 16:00', 5, 'Lab 201', 'Information Technology', 'Level 100'),
('Wednesday', '10:00 - 12:00', 7, 'Room 301', 'Cybersecurity', 'Level 100'),
('Thursday', '08:00 - 10:00', 10, 'Lab 401', 'Data Science', 'Level 200'),
('Friday', '14:00 - 16:00', 3, 'Room 105', 'Software Engineering', 'Level 100');

-- Sample admin user (password: admin123)
INSERT INTO admin_users (name, email, phone, department, employee_id, password_hash) VALUES
('Dr. John Smith', 'admin@university.edu', '+1234567890', 'Computer Science', 'EMP001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Create views for easier data access

-- View for current sessions
CREATE OR REPLACE VIEW current_sessions AS
SELECT 
    CONCAT(c.code, '-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', t.time_slot) as id,
    c.title as courseTitle,
    c.code as courseCode,
    c.field as fieldName,
    c.level,
    t.room,
    t.time_slot,
    SUBSTRING_INDEX(t.time_slot, ' - ', 1) as startTime,
    SUBSTRING_INDEX(t.time_slot, ' - ', -1) as endTime,
    t.day,
    c.lecturer
FROM courses c
JOIN timetable t ON c.id = t.course_id
WHERE t.day = DAYNAME(NOW())
AND TIME(NOW()) BETWEEN 
    TIME(SUBSTRING_INDEX(t.time_slot, ' - ', 1)) 
    AND TIME(SUBSTRING_INDEX(t.time_slot, ' - ', -1));

-- View for absentee reports
CREATE OR REPLACE VIEW absentee_report AS
SELECT 
    a.id,
    s.name as studentName,
    s.matricule,
    s.field as fieldName,
    s.level,
    sess.id as sessionId,
    c.title as courseTitle,
    c.code as courseCode,
    s.parent_name as parentName,
    s.parent_phone as parentPhone,
    s.parent_email as parentEmail,
    a.timestamp as date
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN sessions sess ON a.session_id = sess.id
JOIN courses c ON sess.course_id = c.id
WHERE a.is_present = 0;