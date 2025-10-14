// Konfiguracja Supabase - ZMIEŃ TE DANE NA SWOJE!
const SUPABASE_URL = 'https://ubkzwrgkccxvyaiagudg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3p3cmdrY2N4dnlhaWFndWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjUxNTYsImV4cCI6MjA3NTkwMTE1Nn0.22DTU-GTxzPEHmpbXkzoUda87S36Hi8QFu_GrG-Zx0Y';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sprawdź czy użytkownik jest już zalogowany przy ładowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// Sprawdź autoryzację
async function checkAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        showAppSection(user);
    }
}

// Logowanie
// Logowanie - POPRAWIONA WERSJA
// Logowanie - UPROSZCZONE
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Proszę wypełnić wszystkie pola!');
        return;
    }

    // TYMCZASOWE ROZWIĄZANIE - sprawdź w konsoli
    console.log('Próba logowania:', email, password);
    
    // Sprawdź bezpośrednio w tabeli
    const { data, error } = await supabase
        .from('uzytkownicy')
        .select('*')
        .eq('mail', email)
        .eq('haslo', password);

    console.log('Wynik zapytania:', data, error);

    if (error) {
        alert('Błąd bazy danych: ' + error.message);
    } else if (!data || data.length === 0) {
        alert('Błędny email lub hasło!');
    } else {
        const user = data[0];
        localStorage.setItem('user', JSON.stringify(user));
        showAppSection(user);
        alert('Logowanie udane! Witaj ' + user.mail);
    }
}
// Rejestracja
async function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (!email || !password) {
        alert('Proszę wypełnić wszystkie pola!');
        return;
    }

    try {
        // Sprawdź czy email już istnieje
        const { data: existingUser } = await supabase
            .from('uzytkownicy')
            .select('id')
            .eq('mail', email)
            .single();

        if (existingUser) {
            alert('Ten email jest już zarejestrowany!');
            return;
        }

        // Dodaj nowego użytkownika
        const { data, error } = await supabase
            .from('uzytkownicy')
            .insert([
                { 
                    mail: email,
                    haslo: password,
                    admin: false
                }
            ])
            .select();

        if (error) {
            alert('Błąd rejestracji: ' + error.message);
        } else {
            alert('Rejestracja udana! Możesz się teraz zalogować.');
            showLogin();
        }
    } catch (err) {
        alert('Błąd rejestracji: ' + err.message);
    }
}

// Wylogowanie
function logout() {
    localStorage.removeItem('user');
    showLogin();
}

// Pokazywanie formularza logowania
// Pokazywanie formularza logowania
function showLogin() {
    console.log('showLogin called'); // Debug
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('app-section').style.display = 'none';
    
    // Wyczyść formularze
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

// Pokazywanie formularza rejestracji
function showRegister() {
    console.log('showRegister called'); // Debug
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
}

// Pokazywanie głównej aplikacji
function showAppSection(userData) {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('app-section').classList.add('active');
    
    if (userData.admin) {
        showAdminView(userData);
    } else {
        showUserView(userData);
    }
}

// WIDOK ADMINA
async function showAdminView(user) {
    const appSection = document.getElementById('app-section');
    appSection.innerHTML = `
        <div class="admin-view fade-in">
            <div class="admin-header">
                <div>
                    <h2>👑 Panel Administratora</h2>
                    <p>Witaj, ${user.mail}</p>
                </div>
                <button onclick="logout()" class="btn btn-secondary">Wyloguj</button>
            </div>
            
            <div class="admin-actions">
                <h3>Akcje administracyjne</h3>
                <button onclick="showAllLists()" class="btn btn-primary">Pokaż wszystkie listy</button>
                <button onclick="showAddListForm()" class="btn btn-success">Dodaj nowy list</button>
                <button onclick="showStatistics()" class="btn btn-info">Statystyki</button>
            </div>
            
            <div id="admin-content" class="loading">
                Ładowanie danych...
            </div>
        </div>
    `;
    
    await loadAllLists();
}

// WIDOK UŻYTKOWNIKA
async function showUserView(user) {
    const appSection = document.getElementById('app-section');
    appSection.innerHTML = `
        <div class="user-view fade-in">
            <div class="user-header">
                <div>
                    <h2>🎅 System Rezerwacji Listów</h2>
                    <p>Witaj, ${user.mail}!</p>
                </div>
                <button onclick="logout()" class="btn btn-secondary">Wyloguj</button>
            </div>
            
            <div class="user-sections">
                <div class="user-section">
                    <h3>📜 Listy dostępne do rezerwacji</h3>
                    <div id="available-lists" class="loading">
                        Ładowanie dostępnych listów...
                    </div>
                </div>
                
                <div class="user-section">
                    <h3>✅ Twoje zarezerwowane listy</h3>
                    <div id="my-lists" class="loading">
                        Ładowanie Twoich listów...
                    </div>
                </div>
            </div>
        </div>
    `;
    
    await loadUserLists(user.id);
}

// Załaduj wszystkie listy (dla admina)
async function loadAllLists() {
    try {
        const { data, error } = await supabase
            .from('listy')
            .select(`
                *,
                uzytkownicy:osoba_rezerwujaca(mail)
            `)
            .order('numer_listu');

        if (error) {
            document.getElementById('admin-content').innerHTML = '<p class="error">Błąd ładowania list: ' + error.message + '</p>';
        } else {
            displayAllLists(data);
        }
    } catch (err) {
        document.getElementById('admin-content').innerHTML = '<p class="error">Błąd: ' + err.message + '</p>';
    }
}

// Załaduj listy dla użytkownika
async function loadUserLists(userId) {
    try {
        // Listy dostępne
        const { data: availableLists, error: error1 } = await supabase
            .from('listy')
            .select('*')
            .eq('status', 'dostępny')
            .order('numer_listu');

        // Listy zarezerwowane przez użytkownika
        const { data: myLists, error: error2 } = await supabase
            .from('listy')
            .select('*')
            .eq('osoba_rezerwujaca', userId)
            .order('numer_listu');

        if (!error1 && !error2) {
            displayAvailableLists(availableLists);
            displayMyLists(myLists);
        }
    } catch (err) {
        console.error('Błąd:', err);
    }
}

// Wyświetl wszystkie listy (dla admina)
function displayAllLists(lists) {
    const content = document.getElementById('admin-content');
    
    if (!lists || lists.length === 0) {
        content.innerHTML = '<p>Brak listów w systemie.</p>';
        return;
    }

    // Statystyki
    const total = lists.length;
    const available = lists.filter(l => l.status === 'dostępny').length;
    const reserved = lists.filter(l => l.status === 'zarezerwowany').length;

    content.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <span class="stat-number">${total}</span>
                <span class="stat-label">Wszystkie listy</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${available}</span>
                <span class="stat-label">Dostępne</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">${reserved}</span>
                <span class="stat-label">Zarezerwowane</span>
            </div>
        </div>
        
        <h3>Wszystkie listy (${lists.length})</h3>
        <div class="lists-grid">
            ${lists.map(list => `
                <div class="list-card ${list.status}">
                    <h4>List ${list.numer_listu}</h4>
                    <p><strong>Dziecko:</strong> ${list.imie_wiek}</p>
                    <p><strong>Opis:</strong> ${list.opis}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-badge status-${list.status}">${list.status}</span>
                    </p>
                    <p><strong>Zarezerwowany przez:</strong> ${list.uzytkownicy?.mail || 'brak'}</p>
                    <div class="list-actions">
                        ${list.status === 'dostępny' ? 
                            `<button onclick="reserveList('${list.numer_listu}', null)" class="btn btn-success btn-small">Zarezerwuj jako admin</button>` :
                            `<button onclick="cancelReservation('${list.numer_listu}')" class="btn btn-danger btn-small">Anuluj rezerwację</button>`
                        }
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Wyświetl dostępne listy (dla użytkownika)
function displayAvailableLists(lists) {
    const container = document.getElementById('available-lists');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!lists || lists.length === 0) {
        container.innerHTML = '<p>Brak dostępnych listów.</p>';
        return;
    }

    container.innerHTML = lists.map(list => `
        <div class="list-card available">
            <h4>List ${list.numer_listu}</h4>
            <p><strong>Dziecko:</strong> ${list.imie_wiek}</p>
            <p><strong>Opis:</strong> ${list.opis}</p>
            <div class="list-actions">
                <button onclick="reserveList('${list.numer_listu}', ${user.id})" class="btn btn-success">
                    Zarezerwuj ten list
                </button>
            </div>
        </div>
    `).join('');
}

// Wyświetl listy użytkownika
function displayMyLists(lists) {
    const container = document.getElementById('my-lists');
    
    if (!lists || lists.length === 0) {
        container.innerHTML = '<p>Nie masz zarezerwowanych listów.</p>';
        return;
    }

    container.innerHTML = lists.map(list => `
        <div class="list-card reserved">
            <h4>List ${list.numer_listu}</h4>
            <p><strong>Dziecko:</strong> ${list.imie_wiek}</p>
            <p><strong>Opis:</strong> ${list.opis}</p>
            <p><strong>Status:</strong> 
                <span class="status-badge status-${list.status}">${list.status}</span>
            </p>
            <div class="list-actions">
                <button onclick="cancelReservation('${list.numer_listu}')" class="btn btn-danger">
                    Anuluj rezerwację
                </button>
            </div>
        </div>
    `).join('');
}

// Rezerwacja listu
async function reserveList(listNumber, userId) {
    try {
        const { data, error } = await supabase
            .from('listy')
            .update({
                osoba_rezerwujaca: userId,
                status: 'zarezerwowany'
            })
            .eq('numer_listu', listNumber)
            .eq('status', 'dostępny');

        if (error) {
            alert('Błąd rezerwacji: ' + error.message);
        } else if (data && data.length > 0) {
            alert('List został zarezerwowany!');
            // Odśwież widok
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.admin) {
                await loadAllLists();
            } else {
                await loadUserLists(user.id);
            }
        } else {
            alert('Ten list jest już zarezerwowany!');
        }
    } catch (err) {
        alert('Błąd: ' + err.message);
    }
}

// Anulowanie rezerwacji
async function cancelReservation(listNumber) {
    try {
        const { data, error } = await supabase
            .from('listy')
            .update({
                osoba_rezerwujaca: null,
                status: 'dostępny'
            })
            .eq('numer_listu', listNumber);

        if (error) {
            alert('Błąd anulowania: ' + error.message);
        } else {
            alert('Rezerwacja anulowana!');
            // Odśwież widok
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.admin) {
                await loadAllLists();
            } else {
                await loadUserLists(user.id);
            }
        }
    } catch (err) {
        alert('Błąd: ' + err.message);
    }
}

// Funkcje dla admina (do dokończenia)
function showAddListForm() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div class="add-list-form">
            <h3>Dodaj nowy list</h3>
            <p>Ta funkcja będzie dostępna wkrótce...</p>
            <button onclick="showAllLists()" class="btn btn-primary">Wróć do list</button>
        </div>
    `;
}

function showStatistics() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div class="add-list-form">
            <h3>Statystyki</h3>
            <p>Ta funkcja będzie dostępna wkrótce...</p>
            <button onclick="showAllLists()" class="btn btn-primary">Wróć do list</button>
        </div>
    `;
}

// Obsługa Enter w formularzach
document.addEventListener('DOMContentLoaded', function() {
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
});