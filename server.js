const path = require('path');
// --- ផ្នែកទី ១៖ ហៅបណ្ណាល័យមកប្រើ (Imports) ---
const express = require('express'); // បង្កើត Web Server
const mysql = require('mysql2');   // សម្រាប់និយាយជាមួយ Database
const app = express();           // បង្កើតតួអង្គ Server ឈ្មោះ app

// --- ផ្នែកទី ២៖ កំណត់ឱ្យ Server ស្គាល់ទិន្នន័យពី Form ---
app.use(express.urlencoded({ extended: true })); // ឱ្យ Server ចេះអានអក្សរពី Form
app.use(express.json()); // បន្ថែមនេះដើម្បីឱ្យ Server ចេះអាន JSON
app.use(express.static('public'));               // ឱ្យវាស្គាល់ឯកសារក្នុង folder public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ផ្នែកទី ៣៖ តភ្ជាប់ទៅកាន់ Database (Connection Pool) ---
const pool = mysql.createPool({
    host: 'localhost',           // ម៉ាស៊ីន Dell ខ្លួនឯង
    user: 'root',                // ឈ្មោះ User MySQL របស់បង
    password: 'BouChimBouLay0236', // ប្តូរទៅជាលេខសម្ងាត់ពិតរបស់បង
    database: 'staff_management' // ឈ្មោះ Database ដែលយើងទើបបង្កើត
});

// បម្លែង pool ឲ្យមាន Promise សម្រាប់ងាយស្រួលប្រើ
const promisePool = pool.promise();

// --- ផ្នែកទី ៤៖ បង្កើតផ្លូវទទួលទិន្នន័យ (POST Route) ---
app.post('/save', (req, res) => {
    // ១. ចាប់យកទិន្នន័យ (កែពី salay ទៅ salary)
    const { name, salary, join_date, phone } = req.body; 
    
    // ២. កូដ SQL (កែពី salary ទៅ salary ឱ្យត្រូវតាម Database)
    const sql = "INSERT INTO employees (full_name, salary, join_date, phone) VALUES (?, ?, ?, ?)";
    
    // ៣. បញ្ជូនទិន្នន័យ (លំដាប់៖ ឈ្មោះ, ប្រាក់ខែ, ថ្ងៃចូល, លេខទូរស័ព្ទ)
    pool.query(sql, [name, salary, join_date, phone], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("មានបញ្ហាបច្ចេកទេស៖ " + err.message);
        }
        res.send("ទិន្នន័យត្រូវបានរក្សាទុកដោយជោគជ័យ!");
    });
});

// --- ផ្នែកបន្ថែម៖ ទាញបញ្ជីឈ្មោះបុគ្គលិកមកបង្ហាញ ---
app.get('/employees', (req, res) => {
    const sql = "SELECT * FROM employees ORDER BY id DESC";
    pool.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json(results); // បញ្ជូនទិន្នន័យជា JSON ទៅឱ្យ Frontend
    });
});

// មុខងារលុបទិន្នន័យ (កែហើយ)
app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    
    // ពិនិត្យមើលថា ID មានទេ?
    if (!id) {
        return res.status(400).send("សូមផ្តល់លេខសម្គាល់បុគ្គលិក");
    }
    
    const sql = "DELETE FROM employees WHERE id = ?";
    pool.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting employee:", err);
            return res.status(500).send("មានបញ្ហាក្នុងការលុបទិន្នន័យ: " + err.message);
        }
        
        // ពិនិត្យមើលថាតើមានទិន្នន័យត្រូវបានលុបឬទេ?
        if (result.affectedRows === 0) {
            return res.status(404).send("រកមិនឃើញបុគ្គលិកដែលមានលេខសម្គាល់នេះទេ");
        }
        
        res.send("លុបបានជោគជ័យ");
    });
});

// បន្ថែមមុខងារលុបច្រើននាក់ក្នុងពេលតែមួយ (សម្រាប់ប៊ូតុងលុបខាងក្រៅតារាង)
app.delete('/delete-multiple', (req, res) => {
    const { ids } = req.body; // ទទួល array នៃ ID ពី Frontend
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send("សូមផ្តល់លេខសម្គាល់បុគ្គលិកដែលត្រូវលុប");
    }
    
    // បង្កើតសញ្ញាសួរ (?) សម្រាប់ ID នីមួយៗ
    const placeholders = ids.map(() => '?').join(',');
    const sql = `DELETE FROM employees WHERE id IN (${placeholders})`;
    
    pool.query(sql, ids, (err, result) => {
        if (err) {
            console.error("Error deleting multiple employees:", err);
            return res.status(500).send("មានបញ្ហាក្នុងការលុបទិន្នន័យ: " + err.message);
        }
        
        res.send(`លុបបានជោគជ័យ ${result.affectedRows} នាក់`);
    });
});

// --- ផ្នែកទី ៥៖ បញ្ជាឱ្យ Server រង់ចាំការបញ្ជា (Listen) ---
const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server កំពុងរត់លើ៖ http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Error: Port ${PORT} ត្រូវបានគេប្រើបាត់ហើយ។ សូមបិទវាសិន ឬប្តូរលេខ Port!`);
    } else {
        console.log("មានបញ្ហា៖", err.message);
    }
});