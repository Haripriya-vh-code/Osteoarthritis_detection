import sqlite3

def get_db_connection():
    conn = sqlite3.connect("database.db")
    # This enables dictionary-like access to rows (e.g., row['email'])
    conn.row_factory = sqlite3.Row 
    return conn

# Example: Fetch a patient by ID
def get_patient(patient_id):
    conn = get_db_connection()
    patient = conn.execute(
        "SELECT * FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()
    conn.close()
    return patient

# Example: Create a new assessment session
def create_session(patient_id, status="PENDING"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO assessment_sessions (patient_id, status) VALUES (?, ?)",
        (patient_id, status)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id