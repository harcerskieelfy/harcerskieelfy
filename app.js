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
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Proszę wypełnić wszystkie pola!');
        return;
    }

    // Tymczasowe logowanie admina
    if(email === "admin" && password === "admin") {
        const user = { 
            id: 1, 
            mail: "admin", 
            admin: true 
        };
        localStorage.setItem('user', JSON.stringify(user));
        showAppSection(user);
        alert('Logowanie udane! Witaj Administratorze!');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('uzytkownicy')
            .select('*')
            .eq('mail', email)
            .eq('haslo', password);

        if (error) {
            alert('Błąd bazy danych: ' + error.message);
            return;
        }

        if (!data || data.length === 0) {
            alert('Błędny email lub hasło!');
            return;
        }

        const user = data[0];
        localStorage.setItem('user', JSON.stringify(user));
        showAppSection(user);
        alert('Logowanie udane! Witaj ' + user.mail);
        
    } catch (err) {
        alert('Błąd logowania: ' + err.message);
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
function showLogin() {
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
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('app-section').style.display = 'none';
}

// Pokazywanie głównej aplikacji
function showAppSection(userData) {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    
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
                    <h2> Panel administratora</h2>
                    <p>Witaj, ${user.mail}</p>
                </div>
                <button onclick="logout()" class="btn btn-secondary"> Wyloguj</button>
            </div>
            
            <div class="admin-actions">
                <div class="action-buttons">
                    <button onclick="showAllLists()" class="btn btn-primary">📋 Pokaż wszystkie listy</button>
                    <button onclick="showAddListForm()" class="btn btn-success">➕ Dodaj nowy list</button>
                    <button onclick="showBulkAddForm()" class="btn btn-info">📦 Masowe dodawanie</button>
                </div>
            </div>
            
            <div id="admin-content" class="loading">
                🎄 Ładowanie danych...
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
                    <h2>🎁 System Rezerwacji Listów</h2>
                    <p>Witaj, ${user.mail}!</p>
                </div>
                <button onclick="logout()" class="btn btn-secondary">🚪 Wyloguj</button>
            </div>
            
            <div class="user-sections">
                <div class="user-section">
                    <h3>📜 Listy dostępne do rezerwacji</h3>
                    <div id="available-lists" class="loading">
                        🎄 Ładowanie dostępnych listów...
                    </div>
                </div>
                
                <div class="user-section">
                    <h3>⭐ Twoje zarezerwowane listy</h3>
                    <div id="my-lists" class="loading">
                        🎄 Ładowanie Twoich listów...
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
        const { data: lists, error } = await supabase
            .from('listy')
            .select('*')
            .order('numer_listu');

        if (error) throw error;

        displayAllLists(lists || []);

    } catch (err) {
        console.error('Błąd ładowania list:', err);
        document.getElementById('admin-content').innerHTML = `
            <div class="error-message">
                <h3>❌ Błąd ładowania list</h3>
                <p>${err.message}</p>
                <button onclick="createSampleLists()" class="btn btn-primary">🎄 Utwórz przykładowe listy</button>
            </div>
        `;
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
            displayAvailableLists(availableLists || []);
            displayMyLists(myLists || []);
        }
    } catch (err) {
        console.error('Błąd:', err);
    }
}

// Wyświetl wszystkie listy (dla admina)
function displayAllLists(lists) {
    const content = document.getElementById('admin-content');
    
    if (!lists || lists.length === 0) {
        content.innerHTML = '<div class="photo-placeholder">📭 Brak listów w systemie</div>';
        return;
    }

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
        
        <h3>📋 Wszystkie listy (${lists.length})</h3>
        <div class="lists-grid">
            ${lists.map(list => `
                <div class="list-card ${list.status}">
                    <h4> List ${list.numer_listu}</h4>
                    <p><strong>Senior :</strong> ${list.imie_wiek}</p>
                    <p><strong>Opis prezentu:</strong> ${list.opis_prezentu || 'Brak opisu'}</p>
                    
                    <div class="photo-container">
                        ${list.zdjecie_url ? `
                            <button onclick="togglePhoto('${list.numer_listu}')" class="show-photo-btn" id="btn-${list.numer_listu}">
                                👁️ Pokaż zdjęcie
                            </button>
                            <img src="${list.zdjecie_url}" 
                                 alt="Zdjęcie listu ${list.numer_listu}" 
                                 style="display: none; max-width: 100%; max-height: 400px; border-radius: 10px; margin: 15px 0; border: 3px solid #4caf50; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"
                                 id="img-${list.numer_listu}"
                                 onerror="document.getElementById('btn-${list.numer_listu}').style.display='none';">
                        ` : `
                            <div class="photo-placeholder">
                                📄 Brak zdjęcia
                            </div>
                        `}
                    </div>
                    
                    <p><strong>📊 Status:</strong> 
                        <span class="status-badge status-${list.status}">${list.status}</span>
                    </p>
                    
                    <div class="list-actions">
                        ${list.status === 'dostępny' ? 
                            `<button onclick="reserveAsAdmin('${list.numer_listu}')" class="btn btn-success btn-small">✅ Zarezerwuj</button>` :
                            `<button onclick="cancelReservation('${list.numer_listu}')" class="btn btn-danger btn-small">❌ Anuluj rezerwację</button>`
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
        container.innerHTML = '<div class="photo-placeholder">📭 Brak dostępnych listów</div>';
        return;
    }

    container.innerHTML = lists.map(list => `
        <div class="list-card available">
            <h4>List ${list.numer_listu}</h4>
            <p><strong>Senior:</strong> ${list.imie_wiek}</p>
            <p><strong>Opis prezentu:</strong> ${list.opis_prezentu || 'Brak opisu'}</p>
            
            <div class="photo-container">
                ${list.zdjecie_url ? `
                    <button onclick="togglePhoto('${list.numer_listu}')" class="show-photo-btn" id="btn-${list.numer_listu}">
                        👁️ Pokaż zdjęcie
                    </button>
                    <img src="${list.zdjecie_url}" 
                         alt="Zdjęcie listu ${list.numer_listu}" 
                         style="display: none; max-width: 100%; max-height: 400px; border-radius: 10px; margin: 15px 0; border: 3px solid #4caf50; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"
                         id="img-${list.numer_listu}"                         onerror="document.getElementById('btn-${list.numer_listu}').style.display='none';">
                ` : `
                    <div class="photo-placeholder">
                        📄 Brak zdjęcia
                    </div>
                `}
            </div>
            
            <div class="list-actions">
                <button onclick="reserveList('${list.numer_listu}', ${user.id})" class="btn btn-success">
                    ✅ Zarezerwuj ten list
                </button>
            </div>
        </div>
    `).join('');
}

// Wyświetl listy użytkownika
function displayMyLists(lists) {
    const container = document.getElementById('my-lists');
    
    if (!lists || lists.length === 0) {
        container.innerHTML = '<div class="photo-placeholder">📭 Nie masz zarezerwowanych listów</div>';
        return;
    }

    container.innerHTML = lists.map(list => `
        <div class="list-card reserved">
            <h4> List ${list.numer_listu}</h4>
            <p><strong>Senior:</strong> ${list.imie_wiek}</p>
            <p><strong>Opis prezentu:</strong> ${list.opis_prezentu || 'Brak opisu'}</p>
            
            <div class="photo-container">
                ${list.zdjecie_url ? `
                    <button onclick="togglePhoto('${list.numer_listu}')" class="show-photo-btn" id="btn-${list.numer_listu}">
                        👁️ Pokaż zdjęcie
                    </button>
                    <img src="${list.zdjecie_url}" 
                         alt="Zdjęcie listu ${list.numer_listu}" 
                         style="display: none; max-width: 100%; max-height: 400px; border-radius: 10px; margin: 15px 0; border: 3px solid #4caf50; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"
                         id="img-${list.numer_listu}"
                         onerror="document.getElementById('btn-${list.numer_listu}').style.display='none';">
                ` : `
                    <div class="photo-placeholder">
                        📄 Brak zdjęcia
                    </div>
                `}
            </div>
            
            <p><strong>📊 Status:</strong> 
                <span class="status-badge status-${list.status}">${list.status}</span>
            </p>
            <div class="list-actions">
                <button onclick="cancelReservation('${list.numer_listu}')" class="btn btn-danger">
                    ❌ Anuluj rezerwację
                </button>
            </div>
        </div>
    `).join('');
}

// Funkcja do pokazywania/ukrywania zdjęć
function togglePhoto(listNumber) {
    const button = document.getElementById(`btn-${listNumber}`);
    const image = document.getElementById(`img-${listNumber}`);
    
    if (image.style.display === 'none' || image.style.display === '') {
        // Pokaż zdjęcie
        image.style.display = 'block';
        button.textContent = '🙈 Ukryj zdjęcie';
        button.classList.remove('show-photo-btn');
        button.classList.add('hide-photo-btn');
        
        // Dodaj przycisk do powiększenia jeśli nie istnieje
        if (!button.nextElementSibling || !button.nextElementSibling.classList.contains('view-full-btn')) {
            const viewFullBtn = document.createElement('button');
            viewFullBtn.textContent = '🔍 Powiększ';
            viewFullBtn.className = 'btn btn-small btn-info view-full-btn';
            viewFullBtn.style.marginLeft = '10px';
            viewFullBtn.onclick = () => window.open(image.src, '_blank');
            button.parentNode.insertBefore(viewFullBtn, button.nextElementSibling);
        }
    } else {
        // Ukryj zdjęcie
        image.style.display = 'none';
        button.textContent = '👁️ Pokaż zdjęcie';
        button.classList.remove('hide-photo-btn');
        button.classList.add('show-photo-btn');
        
        // Usuń przycisk powiększenia
        const viewFullBtn = button.nextElementSibling;
        if (viewFullBtn && viewFullBtn.classList.contains('view-full-btn')) {
            viewFullBtn.remove();
        }
    }
}

// Rezerwacja listu przez użytkownika
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
            alert('❌ Błąd rezerwacji: ' + error.message);
        } else if (data && data.length > 0) {
            alert('✅ List został zarezerwowany!');
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.admin) {
                await loadAllLists();
            } else {
                await loadUserLists(user.id);
            }
        } else {
            alert('⚠️ Ten list jest już zarezerwowany!');
        }
    } catch (err) {
        alert('❌ Błąd: ' + err.message);
    }
}

// Rezerwacja przez admina
async function reserveAsAdmin(listNumber, userID) {
    try {
        const { data, error } = await supabase
            .from('listy')
            .update({
                osoba_rezerwujaca: userID,
                status: 'zarezerwowany'
            })
            .eq('numer_listu', listNumber)
            .eq('status', 'dostępny');

        if (error) {
            alert('❌ Błąd rezerwacji: ' + error.message);
        } else if (data && data.length > 0) {
            alert('✅ List został zarezerwowany przez administratora!');
            await loadAllLists();
        } else {
            alert('⚠️ Ten list jest już zarezerwowany!');
        }
    } catch (err) {
        alert('❌ Błąd: ' + err.message);
    }
}

// Anulowanie rezerwacji
async function cancelReservation(listNumber) {
    if (!confirm('❓ Czy na pewno chcesz anulować rezerwację tego listu?')) {
        return;
    }

    try {
        const { data, error } = await supabase
            .from('listy')
            .update({
                osoba_rezerwujaca: null,
                status: 'dostępny'
            })
            .eq('numer_listu', listNumber);

        if (error) {
            alert('❌ Błąd anulowania: ' + error.message);
        } else {
            alert('✅ Rezerwacja anulowana!');
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.admin) {
                await loadAllLists();
            } else {
                await loadUserLists(user.id);
            }
        }
    } catch (err) {
        alert('❌ Błąd: ' + err.message);
    }
}

// Funkcja do tworzenia przykładowych listów
async function createSampleLists() {
    try {
        const sampleLists = [
            { 
                numer_listu: 'L001', 
                imie_wiek: 'Ania, 5 lat', 
                opis_prezentu: 'Marzy o lalce Barbie i książkach z bajkami', 
                osoba_rezerwujaca: null, 
                status: 'dostępny' 
            },
            { 
                numer_listu: 'L002', 
                imie_wiek: 'Kacper, 7 lat', 
                opis_prezentu: 'Chciałby dostać klocki Lego i piłkę nożną', 
                osoba_rezerwujaca: null, 
                status: 'dostępny' 
            },
            { 
                numer_listu: 'L003', 
                imie_wiek: 'Zuzia, 4 lata', 
                opis_prezentu: 'Marzy o zestawie małego lekarza i puzzlach', 
                osoba_rezerwujaca: null, 
                status: 'dostępny' 
            },
            { 
                numer_listu: 'L004', 
                imie_wiek: 'Janek, 8 lat', 
                opis_prezentu: 'Chce zestaw science i grę planszową', 
                osoba_rezerwujaca: null, 
                status: 'dostępny' 
            },
            { 
                numer_listu: 'L005', 
                imie_wiek: 'Ola, 6 lat', 
                opis_prezentu: 'Marzy o rowerku i kredkach', 
                osoba_rezerwujaca: null, 
                status: 'dostępny' 
            }
        ];

        for (const list of sampleLists) {
            const { error } = await supabase
                .from('listy')
                .insert([list]);

            if (error && !error.message.includes('duplicate key')) {
                console.error('Błąd dodawania listu:', error);
            }
        }

        alert('✅ Przykładowe listy zostały utworzone!');
        await loadAllLists();
        
    } catch (err) {
        alert('❌ Błąd tworzenia listów: ' + err.message);
        console.error(err);
    }
}

function showAllLists() {
    loadAllLists();
}

// ==============================================
// FUNKCJE DODAWANIA LISTÓW DLA ADMINISTRATORA
// ==============================================

function showAddListForm() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div class="add-list-form fade-in">
            <div class="form-header">
                <h3>📝 Dodaj nowy list</h3>
                <button onclick="showAllLists()" class="btn btn-secondary">← Wróć do list</button>
            </div>
            
            <form id="add-list-form" onsubmit="handleAddList(event)">
                <div class="form-group">
                    <label for="list-number">🔢 Numer listu *</label>
                    <input type="text" id="list-number" class="input" required 
                           placeholder="np. L001, L002, L003...">
                    <small style="color: #666; font-size: 0.9rem;">Numer musi być unikalny</small>
                </div>
                
                <div class="form-group">
                    <label for="child-name">👶 Dziecko (imię i wiek) *</label>
                    <input type="text" id="child-name" class="input" required 
                           placeholder="np. Ania, 5 lat">
                </div>
                
                <div class="form-group">
                    <label for="gift-description">🎁 Opis prezentu *</label>
                    <textarea id="gift-description" class="input textarea" required 
                              placeholder="Opisz czego dziecko potrzebuje lub o czym marzy...&#10;np. 'Marzy o lalce Barbie i książkach z bajkami'&#10;np. 'Potrzebuje buty zimowe rozmiar 28'"
                              rows="4"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="list-photo">📸 Zdjęcie listu (opcjonalnie)</label>
                    <input type="file" id="list-photo" class="input file-input" 
                           accept="image/*" onchange="previewPhoto(event)">
                    <small style="color: #666; font-size: 0.9rem;">Dozwolone formaty: JPG, PNG, GIF (max 5MB)</small>
                    <div id="photo-preview-container" style="margin-top: 15px;"></div>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="showAllLists()" class="btn btn-secondary">❌ Anuluj</button>
                    <button type="submit" class="btn btn-success">✅ Dodaj list</button>
                </div>
            </form>
            
            <div class="form-info">
                <h4>💡 Wskazówki:</h4>
                <ul>
                    <li>Pola oznaczone * są wymagane</li>
                    <li>Numer listu powinien być unikalny w systemie</li>
                    <li>Opis powinien być konkretny, aby darczyńca wiedział co kupić</li>
                    <li>Zdjęcie listu pomaga w identyfikacji dziecka</li>
                </ul>
            </div>
        </div>
    `;
}

// Podgląd zdjęcia przed uploadem
function previewPhoto(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('photo-preview-container');
    
    if (file) {
        // Sprawdź rozmiar pliku (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Plik jest za duży! Maksymalny rozmiar to 5MB.');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <div style="text-align: center;">
                    <p style="color: #4caf50; font-weight: 600; margin-bottom: 10px;">📸 Podgląd zdjęcia:</p>
                    <img src="${e.target.result}" 
                         style="max-width: 300px; max-height: 300px; border-radius: 10px; border: 3px solid #4caf50; box-shadow: 0 4px 15px rgba(0,0,0,0.1);"
                         alt="Podgląd zdjęcia">
                    <br>
                    <button type="button" onclick="removePhotoPreview()" class="btn btn-danger btn-small" style="margin-top: 10px;">
                        🗑️ Usuń zdjęcie
                    </button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Usuń podgląd zdjęcia
function removePhotoPreview() {
    document.getElementById('list-photo').value = '';
    document.getElementById('photo-preview-container').innerHTML = '';
}

async function handleAddList(event) {
    event.preventDefault();
    
    const listData = {
        numer_listu: document.getElementById('list-number').value.trim(),
        imie_wiek: document.getElementById('child-name').value.trim(),
        opis_prezentu: document.getElementById('gift-description').value.trim(),
        osoba_rezerwujaca: null,
        status: 'dostępny',
        zdjecie_url: null
    };
    
    console.log('📋 Dane listu:', listData);
    
    // Walidacja
    if (!listData.numer_listu || !listData.imie_wiek || !listData.opis_prezentu) {
        alert('❌ Proszę wypełnić wszystkie wymagane pola!');
        return;
    }
    
    try {
        // Sprawdź czy numer listu istnieje
        const { data: existingList, error: checkError } = await supabase
            .from('listy')
            .select('numer_listu')
            .eq('numer_listu', listData.numer_listu)
            .single();
            
        if (existingList) {
            alert('❌ List z tym numerem już istnieje! Proszę użyć innego numeru.');
            return;
        }
        
        // Upload zdjęcia jeśli zostało dodane
        const photoFile = document.getElementById('list-photo').files[0];
        if (photoFile) {
            try {
                console.log('📸 Rozpoczynam upload zdjęcia...');
                
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${listData.numer_listu}_${Date.now()}.${fileExt}`;
                const filePath = `list-photos/${fileName}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('list-photos')
                    .upload(filePath, photoFile);
                    
                if (uploadError) throw uploadError;
                
                // Pobierz publiczny URL zdjęcia
                const { data: urlData } = supabase.storage
                    .from('list-photos')
                    .getPublicUrl(filePath);
                    
                listData.zdjecie_url = urlData.publicUrl;
                console.log('✅ Zdjęcie uploaded:', listData.zdjecie_url);
            } catch (uploadError) {
                console.error('❌ Błąd uploadu zdjęcia:', uploadError);
                alert('⚠️ Uwaga: Zdjęcie nie zostało zapisane. ' + uploadError.message);
                // Kontynuuj bez zdjęcia
            }
        }
        
        console.log('💾 Dodaję list do bazy...');
        
        const { data, error } = await supabase
            .from('listy')
            .insert([listData]);
            
        console.log('Wynik dodawania:', data, error);
            
        if (error) {
            console.error('❌ Błąd Supabase:', error);
            alert('❌ Błąd podczas dodawania listu: ' + error.message);
            return;
        }
        
        console.log('✅ List dodany pomyślnie!');
        alert('✅ List został pomyślnie dodany!' + (listData.zdjecie_url ? ' Zdjęcie zostało zapisane.' : ''));
        showAllLists();
        
    } catch (err) {
        console.error('❌ Błąd catch:', err);
        alert('❌ Błąd podczas dodawania listu: ' + err.message);
    }
}

function showBulkAddForm() {
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div class="add-list-form">
            <div class="form-header">
                <h3>📦 Masowe dodawanie listów</h3>
                <button onclick="showAllLists()" class="btn btn-secondary">← Wróć</button>
            </div>
            
            <div class="form-info">
                <h4>📋 Instrukcja:</h4>
                <p>Wklej dane listów w formacie CSV. Każdy list w nowej linii, pola oddzielone przecinkami:</p>
                <pre>NumerListu,Imię i wiek,Opis prezentu</pre>
                <p><strong>Przykład:</strong></p>
                <pre>L006,Maciek 6 lat,Klocki Lego i książki o dinozaurach
L007,Karolina 4 lat,Lalka i wózek dla lalki
L008,Piotr 7 lat,Plecak szkolny i piórnik</pre>
            </div>
            
            <form id="bulk-add-form" onsubmit="handleBulkAdd(event)">
                <div class="form-group">
                    <label for="bulk-data">📄 Dane listów *</label>
                    <textarea id="bulk-data" class="input textarea" required 
                              placeholder="Wklej tutaj dane w formacie CSV...&#10;L006,Maciek 6 lat,Klocki Lego&#10;L007,Karolina 4 lat,Lalka&#10;L008,Piotr 7 lat,Plecak"
                              rows="12"></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="showAllLists()" class="btn btn-secondary">❌ Anuluj</button>
                    <button type="submit" class="btn btn-success">✅ Dodaj listy</button>
                </div>
            </form>
        </div>
    `;
}

async function handleBulkAdd(event) {
    event.preventDefault();
    
    const bulkData = document.getElementById('bulk-data').value.trim();
    const lines = bulkData.split('\n').filter(line => line.trim());
    const lists = [];
    
    for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 3) {
            lists.push({
                numer_listu: parts[0],
                imie_wiek: parts[1],
                opis_prezentu: parts[2],
                osoba_rezerwujaca: null,
                status: 'dostępny',
                zdjecie_url: null
            });
        }
    }
    
    if (lists.length === 0) {
        alert('❌ Nie znaleziono poprawnych danych! Sprawdź format.');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('listy')
            .insert(lists);
            
        if (error) {
            alert('❌ Błąd: ' + error.message);
            return;
        }
        
        alert(`✅ Pomyślnie dodano ${lists.length} listów!`);
        showAllLists();
        
    } catch (err) {
        alert('❌ Błąd: ' + err.message);
    }
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

// Funkcja debugowania
function checkLocalStorage() {
    const user = localStorage.getItem('user');
    console.log('LocalStorage user:', user);
    if (user) {
        console.log('Parsed user:', JSON.parse(user));
    }
}

// Funkcja do czyszczenia wszystkich danych (tylko dla developera)
async function clearAllData() {
    if (!confirm('🚨 UWAGA! Czy na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć!')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('listy')
            .delete()
            .neq('numer_listu', '');
            
        if (error) throw error;
        
        alert('✅ Wszystkie dane zostały usunięte!');
        showAllLists();
        
    } catch (err) {
        alert('❌ Błąd usuwania danych: ' + err.message);
    }
}