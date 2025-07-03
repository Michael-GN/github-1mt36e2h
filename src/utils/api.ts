const API_BASE_URL = 'http://localhost/api_update';

export class APIService {
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid JSON response:', text);
      throw new Error('Invalid JSON response from server');
    }
  }

  // Helper function to format datetime for MySQL
  private static formatDateTimeForMySQL(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // Enhanced session generation from timetable
  static async getCurrentSessions() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_current_sessions.php`);
      const data = await this.handleResponse(response);
      
      // If no sessions from API, generate from timetable
      if (!data || data.length === 0) {
        console.log('No sessions from API, generating from timetable...');
        return await this.generateSessionsFromTimetable();
      }
      
      return data;
    } catch (error) {
      console.error('API failed, generating sessions from timetable:', error);
      return await this.generateSessionsFromTimetable();
    }
  }

  // Generate sessions from timetable data
  static async generateSessionsFromTimetable() {
    try {
      const timetable = await this.getTimetable();
      const students = await this.getStudents();
      
      if (!timetable || !students) {
        return [];
      }

      const today = new Date();
      const currentDay = today.toLocaleDateString('en-US', { weekday: 'long' });
      const currentTime = today.getHours() * 60 + today.getMinutes();

      const sessions = timetable
        .filter((entry: any) => entry.day === currentDay)
        .map((entry: any) => {
          const [startTime, endTime] = entry.timeSlot.split(' - ');
          const startMinutes = this.timeToMinutes(startTime);
          const endMinutes = this.timeToMinutes(endTime);

          // Include sessions that are currently active or starting within the next 30 minutes
          const isCurrentOrUpcoming = currentTime >= (startMinutes - 30) && currentTime <= endMinutes;

          if (!isCurrentOrUpcoming) return null;

          const fieldStudents = students.filter((student: any) => 
            student.field === entry.field && student.level === entry.level
          );

          return {
            id: `${entry.field}-${entry.level}-${entry.day}-${entry.timeSlot}`.replace(/\s+/g, '-'),
            courseTitle: entry.course,
            courseCode: entry.course.split(' ').map((word: string) => word.charAt(0)).join('').toUpperCase(),
            fieldName: entry.field,
            level: entry.level,
            room: entry.room,
            startTime: startTime,
            endTime: endTime,
            day: entry.day,
            lecturer: entry.lecturer,
            students: fieldStudents
          };
        })
        .filter((session: any) => session !== null);

      console.log(`Generated ${sessions.length} sessions for ${currentDay}`);
      return sessions;
    } catch (error) {
      console.error('Failed to generate sessions from timetable:', error);
      return [];
    }
  }

  private static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Direct attendance submission to database with proper datetime formatting
  static async submitAttendance(attendanceData: any) {
    try {
      console.log('Submitting attendance directly to database:', attendanceData);
      
      // Format the timestamp for MySQL
      const formattedData = {
        ...attendanceData,
        timestamp: this.formatDateTimeForMySQL(attendanceData.timestamp),
        date: attendanceData.date ? attendanceData.date.split('T')[0] : new Date().toISOString().split('T')[0] // Ensure date is in YYYY-MM-DD format
      };
      
      console.log('Formatted attendance data for MySQL:', formattedData);
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/submit_attendance.php`, {
        method: 'POST',
        body: JSON.stringify(formattedData),
      });
      
      const result = await this.handleResponse(response);
      console.log('Direct attendance submission result:', result);
      return result;
    } catch (error) {
      console.error('Failed to submit attendance to database:', error);
      throw error;
    }
  }

  // Enhanced absentee report with better filtering
  static async getAbsenteeReport(filters: any) {
    try {
      const params = new URLSearchParams();
      
      // Add all filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      console.log('Fetching absentee report with filters:', filters);
      
      const response = await this.fetchWithTimeout(
        `${API_BASE_URL}/get_absentee_report.php?${params}`
      );
      
      const data = await this.handleResponse(response);
      console.log('Absentee report data:', data);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch absentee report:', error);
      throw error;
    }
  }

  // Get student absentee hours from database
  static async getStudentAbsenteeHours() {
    try {
      console.log('Fetching student absentee hours from database...');
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_student_absentee_hours.php`);
      const data = await this.handleResponse(response);
      
      console.log('Student absentee hours data:', data);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch student absentee hours:', error);
      return [];
    }
  }

  // Enhanced dashboard stats
  static async getDashboardStats() {
    try {
      console.log('Fetching dashboard stats...');
      
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_dashboard_stats.php`);
      const data = await this.handleResponse(response);
      
      console.log('Dashboard stats:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  static async getTimetable() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_timetable.php`);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to load timetable from API:', error);
      // Return demo data as fallback
      return [
        {
          id: '1',
          day: 'Monday',
          timeSlot: '08:00 - 10:00',
          course: 'Database Systems',
          field: 'Computer Science',
          level: 'Level 200',
          room: 'Lab 101',
          lecturer: 'Dr. Smith'
        },
        {
          id: '2',
          day: 'Monday',
          timeSlot: '10:00 - 12:00',
          course: 'Programming Fundamentals',
          field: 'Computer Science',
          level: 'Level 100',
          room: 'Room 205',
          lecturer: 'Prof. Wilson'
        },
        {
          id: '3',
          day: 'Tuesday',
          timeSlot: '08:00 - 10:00',
          course: 'Software Engineering Principles',
          field: 'Software Engineering',
          level: 'Level 200',
          room: 'Room 103',
          lecturer: 'Dr. Johnson'
        },
        {
          id: '4',
          day: 'Tuesday',
          timeSlot: '14:00 - 16:00',
          course: 'Web Development Basics',
          field: 'Information Technology',
          level: 'Level 100',
          room: 'Lab 201',
          lecturer: 'Ms. Davis'
        },
        {
          id: '5',
          day: 'Wednesday',
          timeSlot: '10:00 - 12:00',
          course: 'Network Fundamentals',
          field: 'Cybersecurity',
          level: 'Level 200',
          room: 'Room 301',
          lecturer: 'Prof. Brown'
        }
      ];
    }
  }

  static async getStudents() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_students.php`);
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Failed to load students from API:', error);
      // Return demo data as fallback
      return [
        {
          id: '1',
          name: 'Alice Johnson',
          matricule: 'CS200/001',
          field: 'Computer Science',
          level: 'Level 200',
          parentName: 'John Johnson',
          parentPhone: '+1234567890',
          parentEmail: 'john.johnson@email.com'
        },
        {
          id: '2',
          name: 'Bob Smith',
          matricule: 'SE200/002',
          field: 'Software Engineering',
          level: 'Level 200',
          parentName: 'Mary Smith',
          parentPhone: '+1234567891',
          parentEmail: 'mary.smith@email.com'
        },
        {
          id: '3',
          name: 'Carol Davis',
          matricule: 'IT100/003',
          field: 'Information Technology',
          level: 'Level 100',
          parentName: 'Robert Davis',
          parentPhone: '+1234567892',
          parentEmail: 'robert.davis@email.com'
        },
        {
          id: '4',
          name: 'David Wilson',
          matricule: 'CYB200/004',
          field: 'Cybersecurity',
          level: 'Level 200',
          parentName: 'Linda Wilson',
          parentPhone: '+1234567893',
          parentEmail: 'linda.wilson@email.com'
        },
        {
          id: '5',
          name: 'Emma Brown',
          matricule: 'DS100/005',
          field: 'Data Science',
          level: 'Level 100',
          parentName: 'Michael Brown',
          parentPhone: '+1234567894',
          parentEmail: 'michael.brown@email.com'
        }
      ];
    }
  }

  static async getFields() {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_fields.php`);
      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error('Failed to load fields from API:', error);
      // Return demo data as fallback
      return [
        { id: '1', name: 'Computer Science', code: 'CS', totalStudents: 320, levels: ['Level 100', 'Level 200'] },
        { id: '2', name: 'Software Engineering', code: 'SE', totalStudents: 280, levels: ['Level 100', 'Level 200'] },
        { id: '3', name: 'Information Technology', code: 'IT', totalStudents: 250, levels: ['Level 100', 'Level 200'] },
        { id: '4', name: 'Cybersecurity', code: 'CYB', totalStudents: 180, levels: ['Level 100', 'Level 200'] },
        { id: '5', name: 'Data Science', code: 'DS', totalStudents: 220, levels: ['Level 100', 'Level 200'] }
      ];
    }
  }

  static async addStudent(studentData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_student.php`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return this.handleResponse(response);
  }

  static async updateStudent(studentData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_student.php`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    return this.handleResponse(response);
  }

  static async deleteStudent(studentId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_student.php`, {
      method: 'POST',
      body: JSON.stringify({ id: studentId }),
    });
    return this.handleResponse(response);
  }

  static async addField(fieldData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_field.php`, {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
    return this.handleResponse(response);
  }

  static async updateField(fieldData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_field.php`, {
      method: 'POST',
      body: JSON.stringify(fieldData),
    });
    return this.handleResponse(response);
  }

  static async deleteField(fieldId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_field.php`, {
      method: 'POST',
      body: JSON.stringify({ id: fieldId }),
    });
    return this.handleResponse(response);
  }

  static async addTimetableEntry(entryData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_timetable_entry.php`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  static async updateTimetableEntry(entryData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_timetable_entry.php`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  static async deleteTimetableEntry(entryId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_timetable_entry.php`, {
      method: 'POST',
      body: JSON.stringify({ id: entryId }),
    });
    return this.handleResponse(response);
  }

  // Admin Management APIs
  static async getAdminUsers() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_admin_users.php`);
    return this.handleResponse(response);
  }

  static async addAdminUser(adminData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_admin_user.php`, {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    return this.handleResponse(response);
  }

  static async updateAdminUser(adminData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_admin_user.php`, {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
    return this.handleResponse(response);
  }

  static async deleteAdminUser(adminId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_admin_user.php`, {
      method: 'POST',
      body: JSON.stringify({ id: adminId }),
    });
    return this.handleResponse(response);
  }

  static async authenticateAdmin(credentials: { email: string; password: string }) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/authenticate_admin.php`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }
}