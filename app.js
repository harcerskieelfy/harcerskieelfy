// 🔥 ZMIEŃ TE DANE NA SWOJE Z SUPABASE!
const SUPABASE_URL = 'https://ubkzwrgkccxvyaiagudg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3p3cmdrY2N4dnlhaWFndWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjUxNTYsImV4cCI6MjA3NTkwMTE1Nn0.22DTU-GTxzPEHmpbXkzoUda87S36Hi8QFu_GrG-Zx0Y';

// Poczekaj aż strona się załaduje
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Sprawdź czy Supabase jest dostępny
    if (typeof window.supabase !== 'undefined') {
        initSupabase();
    } else {
        // Poczekaj aż Supabase się załaduje
        setTimeout(initSupabase, 100);
    }
}

function initSupabase() {
    try {
        // Inicjalizuj Supabase
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase zainicjalizowany');
        
        // Sprawdź czy użytkownik jest zalogowany
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            showApp(JSON.parse(savedUser));
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Błąd inicjalizacji Supabase:', error);
        alert('Błąd połączenia z bazą danych. Spróbuj odświeżyć stronę.');
    }
}

// Pokaz formularz logowania
function showLogin() {
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('app-section').classList.remove('active');
    
    // Wyczyść formularze
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

// Pokaz formularz rejestracji
function showRegister() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
    document.getElementById('app-section').classList.remove('active');
}

// Rejestracja
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!email || !password) {
        alert('Proszę wpisać email i hasło!');
        return;
    }

    try {
        // Sprawdź czy Supabase jest gotowy
        if (!window.supabaseClient) {
            alert('Błąd połączenia. Spróbuj ponownie.');
            return;
        }

        const { data, error } = await window.supabaseClient
            .from('uzytkownicy')
            .insert([{ 
                email: email, 
                haslo: password, 
                admin: false 
            }])
            .select();

        if (error) {
            alert('Błąd rejestracji: ' + error.message);
        } else {
            alert('Rejestracja udana! Możesz się zalogować.');
            showLogin();
        }
    } catch (err) {
        alert('Błąd: ' + err.message);
    }
}

// Logowanie
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Proszę wpisać email i hasło!');
        return;
    }

    try {
        // Sprawdź czy Supabase jest gotowy
        if (!window.supabaseClient) {
            alert('Błąd połączenia. Spróbuj ponownie.');
            return;
        }

        const { data, error } = await window.supabaseClient
            .from('uzytkownicy')
            .select('*')
            .eq('email', email)
            .eq('haslo', password)
            .single();

        if (error || !data) {
            alert('Błędny email lub hasło!');
        } else {
            localStorage.setItem('user', JSON.stringify(data));
            showApp(data);
        }
    } catch (err) {
        alert('Błąd logowania: ' + err.message);
    }
}

// Wyloguj
function logout() {
    localStorage.removeItem('user');
    showLogin();
}

// Pokaz aplikację
async function showApp(user) {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('app-section').classList.add('active');

    try {
        // Pobierz listy z bazy
        const { data: listy, error } = await window.supabaseClient
            .from('listy')
            .select('*')
            .order('numer_listu');

        if (error) {
            alert('Błąd ładowania list: ' + error.message);
            return;
        }

        let html = '';

        if (user.admin) {
            // Widok administratora
            html = showAdminView(user, listy);
        } else {
            // Widok użytkownika
            html = showUserView(user, listy);
        }

        document.getElementById('app-content').innerHTML = html;
    } catch (err) {
        alert('Błąd ładowania aplikacji: ' + err.message);
    }
}

// Widok administratora
function showAdminView(user, listy) {
    const totalLists = listy.length;
    const availableLists = listy.filter(l => l.status === 'dostępny').length;
    const reservedLists = listy.filter(l => l.status === 'zarezerwowany').length;

    return `
        <div class="admin-panel">
            <div class="app-header">
                <div>
                    <h2>👑 Panel Administratora</h2>
                    <p>Witaj, ${user.email}</p>
                </div>
                <button onclick="logout()" class="btn btn-secondary">Wyloguj</button>
            </div>

            <div class="admin-stats">
                <div class="stat-card">
                    <span class="stat-number">${totalLists}</span>
                    <span class="stat-label">Wszystkie listy</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${availableLists}</span>
                    <span class="stat-label">Dostępne</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${reservedLists}</span>
                    <span class="stat-label">Zarezerwowane</span>
                </div>
            </div>

            <h3>Wszystkie listy</h3>
            <div class="lists-grid">
                ${listy.map(list => `
                    <div class="list-card ${list.status}">
                        <h4>List ${list.numer_listu}</h4>
                        <p><strong>Dziecko:</strong> ${list.imie_wiek}</p>
                        <p><strong>Opis:</strong> ${list.opis}</p>
                        <p><strong>Status:</strong> 
                            <span class="status-badge status-${list.status}">${list.status}</span>
                        </p>
                        <div class="list-actions">
                            ${list.status === 'dostępny' ? 
                                `<button onclick="reserveList('${list.numer_listu}')" class="btn btn-success">Zarezerwuj</button>` :
                                `<button onclick="cancelReservation('${list.numer_listu}')" class="btn btn-danger">Zwolnij</button>`
                            }
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Widok użytkownika
function showUserView(user, listy) {
    const availableLists = listy.filter(l => l.status === 'dostępny');
    const myLists = listy.filter(l => l.osoba_rezerwujaca === user.id);

    return `
        <div class="user-panel">
            <div class="app-header">
                <div>
                    <h2>🎅 System Rezerwacji Listów</h2>
                    <p>Witaj, ${user.email}!</p>
                </div>
                <button onclick="logout()" class="btn btn-secondary">Wyloguj</button>
            </div>

            <div class="lists-container">
                <div class="lists-section">
                    <h3>📜 Listy dostępne do rezerwacji</h3>
                    ${availableLists.length === 0 ? 
                        '<p>Brak dostępnych listów.</p>' :
                        availableLists.map(list => `
                            <div class="list-card dostępny">
                                <h4>List ${list.numer_listu}</h4>
                                <p><strong>Dziecko:</strong> ${list.imie_wiek}</p>
                                <p><strong>Opis:</strong> ${list.opis}</p>
                                <div class="list-actions">
                                    <button onclick="reserveList('${list.numer_listu}')" class="btn btn-success">
                                        Zarezerwuj ten list
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>

                <div class="lists-section">
                    <h3>✅ Twoje zarezerwowane listy</h3>
                    ${myLists.length === 0 ? 
                        '<p>Nie masz zarezerwowanych listów.</p>' :
                        myLists.map(list => `
                            <div class="list-card zarezerwowany">
                                <h4>List ${list.numer_listu}</h4>
                                <p><strong>Dziecko:</strong> ${list.imie_wiek}</p>
                                <p><strong>Opis:</strong> ${list.opis}</p>
                                <div class="list-actions">
                                    <button onclick="cancelReservation('${list.numer_listu}')" class="btn btn-danger">
                                        Anuluj rezerwację
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
}

// Rezerwacja listu
async function reserveList(numerListu) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    try {
        const { error } = await window.supabaseClient
            .from('listy')
            .update({ 
                status: 'zarezerwowany', 
                osoba_rezerwujaca: user.id 
            })
            .eq('numer_listu', numerListu);

        if (error) {
            alert('Błąd rezerwacji: ' + error.message);
        } else {
            alert('List został zarezerwowany!');
            location.reload();
        }
    } catch (err) {
        alert('Błąd: ' + err.message);
    }
}

// Anulowanie rezerwacji
async function cancelReservation(numerListu) {
    try {
        const { error } = await window.supabaseClient
            .from('listy')
            .update({ 
                status: 'dostępny', 
                osoba_rezerwujaca: null 
            })
            .eq('numer_listu', numerListu);

        if (error) {
            alert('Błąd anulowania: ' + error.message);
        } else {
            alert('Rezerwacja anulowana!');
            location.reload();
        }
    } catch (err) {
        alert('Błąd: ' + err.message);
    }
}

// Obsługa Enter w formularzach
document.addEventListener('DOMContentLoaded', function() {
    // Poczekaj chwilę aż wszystko się załaduje
    setTimeout(() => {
        // Enter w login
        document.getElementById('email')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
        
        document.getElementById('password')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });

        // Enter w rejestracji
        document.getElementById('register-email')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') register();
        });
        
        document.getElementById('register-password')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') register();
        });
    }, 500);
});