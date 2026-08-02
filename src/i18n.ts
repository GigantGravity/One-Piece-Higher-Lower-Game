export type Language = 'de' | 'en';

type TranslationKey =
  | 'app.title'
  | 'nav.leaderboard'
  | 'nav.friends'
  | 'nav.login'
  | 'nav.logout'
  | 'nav.loggedInAs'
  | 'game.hasBounty'
  | 'game.has'
  | 'game.higher'
  | 'game.lower'
  | 'game.gameOver'
  | 'game.points'
  | 'game.playAgain'
  | 'game.highScore'
  | 'game.score'
  | 'game.hint'
  | 'game.loading'
  | 'auth.login'
  | 'auth.register'
  | 'auth.username'
  | 'auth.password'
  | 'auth.passwordHint'
  | 'auth.loginButton'
  | 'auth.registerButton'
  | 'auth.loadingButton'
  | 'auth.noAccount'
  | 'auth.registerNow'
  | 'auth.hasAccount'
  | 'auth.loginNow'
  | 'auth.skipAuth'
  | 'leaderboard.title'
  | 'leaderboard.global'
  | 'leaderboard.friends'
  | 'leaderboard.empty'
  | 'leaderboard.loginForFriends'
  | 'leaderboard.back'
  | 'friends.title'
  | 'friends.usernamePlaceholder'
  | 'friends.sendRequest'
  | 'friends.pendingRequests'
  | 'friends.noPendingRequests'
  | 'friends.myFriends'
  | 'friends.noFriends'
  | 'friends.accept'
  | 'friends.decline'
  | 'friends.requestSent'
  | 'friends.requestAccepted'
  | 'friends.requestDeclined'
  | 'error.badRequest'
  | 'error.unauthorized'
  | 'error.forbidden'
  | 'error.notFound'
  | 'error.conflict'
  | 'error.server'
  | 'error.generic'
  | 'error.network'
  | 'leaderboard.topScore'
  | 'nav.game';

type Translations = Record<TranslationKey, string>;

const de: Translations = {
  'app.title': 'One Piece Higher Lower',
  'nav.leaderboard': 'Bestenliste',
  'nav.friends': 'Freunde',
  'nav.login': 'Anmelden',
  'nav.logout': 'Abmelden',
  'nav.loggedInAs': 'Angemeldet als',
  'game.hasBounty': 'hat ein Kopfgeld von',
  'game.has': 'hat ein',
  'game.higher': 'Höheres Kopfgeld ▲',
  'game.lower': 'Niedrigeres Kopfgeld ▼',
  'game.gameOver': 'Game Over!',
  'game.points': 'Punkte.',
  'game.playAgain': 'Nochmal spielen',
  'game.highScore': 'Highscore',
  'game.score': 'Punkte',
  'game.hint': 'Kopfgeld als',
  'game.loading': 'Piraten werden geladen ...',
  'auth.login': 'Anmelden',
  'auth.register': 'Registrieren',
  'auth.username': 'Nutzername',
  'auth.password': 'Passwort',
  'auth.passwordHint': 'Passwort (min. 8 Zeichen)',
  'auth.loginButton': 'Anmelden',
  'auth.registerButton': 'Registrieren',
  'auth.loadingButton': 'Lädt ...',
  'auth.noAccount': 'Noch kein Konto?',
  'auth.registerNow': 'Jetzt registrieren',
  'auth.hasAccount': 'Schon ein Konto?',
  'auth.loginNow': 'Jetzt anmelden',
  'auth.skipAuth': 'Ohne Konto weiterspielen',
  'leaderboard.title': 'Bestenliste',
  'leaderboard.global': 'Global',
  'leaderboard.friends': 'Freunde',
  'leaderboard.empty': 'Noch keine Einträge vorhanden.',
  'leaderboard.loginForFriends': 'Melde dich an, um die Bestenliste deiner Freunde zu sehen.',
  'leaderboard.back': '← Zurück zum Spiel',
  'friends.title': 'Freunde',
  'friends.usernamePlaceholder': 'Nutzername eines Freundes',
  'friends.sendRequest': 'Anfrage senden',
  'friends.pendingRequests': 'Offene Anfragen',
  'friends.noPendingRequests': 'Keine offenen Anfragen.',
  'friends.myFriends': 'Meine Freunde',
  'friends.noFriends': 'Noch keine Freunde hinzugefügt.',
  'friends.accept': 'Annehmen',
  'friends.decline': 'Ablehnen',
  'friends.requestSent': 'Anfrage gesendet.',
  'friends.requestAccepted': 'Freundschaftsanfrage angenommen.',
  'friends.requestDeclined': 'Freundschaftsanfrage abgelehnt.',
  'error.badRequest': 'Die Eingabe war ungültig. Bitte überprüfe deine Angaben.',
  'error.unauthorized': 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
  'error.forbidden': 'Du hast keine Berechtigung für diese Aktion.',
  'error.notFound': 'Das Gesuchte wurde nicht gefunden.',
  'error.conflict': 'Diese Aktion steht im Konflikt mit einem bestehenden Eintrag.',
  'error.server': 'Der Server hat gerade ein Problem. Bitte versuch es später erneut.',
  'error.generic': 'Etwas ist schiefgelaufen. Bitte versuch es erneut.',
  'error.network': 'Keine Verbindung zum Server möglich. Bitte prüfe deine Internetverbindung.',
  'leaderboard.topScore': 'Bester Wert',
  'nav.game': 'Spiel',
};

const en: Translations = {
  'app.title': 'One Piece Higher Lower',
  'nav.leaderboard': 'Leaderboard',
  'nav.friends': 'Friends',
  'nav.login': 'Log in',
  'nav.logout': 'Log out',
  'nav.loggedInAs': 'Logged in as',
  'game.hasBounty': 'has a bounty of',
  'game.has': 'has a',
  'game.higher': 'Higher Bounty ▲',
  'game.lower': 'Lower Bounty ▼',
  'game.gameOver': 'Game Over!',
  'game.points': 'points.',
  'game.playAgain': 'Play again',
  'game.highScore': 'High Score',
  'game.score': 'Score',
  'game.hint': 'bounty compared to',
  'game.loading': 'Loading pirates ...',
  'auth.login': 'Log in',
  'auth.register': 'Register',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.passwordHint': 'Password (min. 8 characters)',
  'auth.loginButton': 'Log in',
  'auth.registerButton': 'Register',
  'auth.loadingButton': 'Loading ...',
  'auth.noAccount': "Don't have an account?",
  'auth.registerNow': 'Register now',
  'auth.hasAccount': 'Already have an account?',
  'auth.loginNow': 'Log in now',
  'auth.skipAuth': 'Continue without an account',
  'leaderboard.title': 'Leaderboard',
  'leaderboard.global': 'Global',
  'leaderboard.friends': 'Friends',
  'leaderboard.empty': 'No entries yet.',
  'leaderboard.loginForFriends': 'Log in to see your friends’ leaderboard.',
  'leaderboard.back': '← Back to game',
  'friends.title': 'Friends',
  'friends.usernamePlaceholder': "A friend's username",
  'friends.sendRequest': 'Send request',
  'friends.pendingRequests': 'Pending requests',
  'friends.noPendingRequests': 'No pending requests.',
  'friends.myFriends': 'My friends',
  'friends.noFriends': 'No friends added yet.',
  'friends.accept': 'Accept',
  'friends.decline': 'Decline',
  'friends.requestSent': 'Request sent.',
  'friends.requestAccepted': 'Friend request accepted.',
  'friends.requestDeclined': 'Friend request declined.',
  'error.badRequest': 'The input was invalid. Please check your details.',
  'error.unauthorized': 'Your session has expired. Please log in again.',
  'error.forbidden': "You don't have permission to do that.",
  'error.notFound': 'The requested item was not found.',
  'error.conflict': 'This action conflicts with an existing entry.',
  'error.server': 'The server ran into a problem. Please try again later.',
  'error.generic': 'Something went wrong. Please try again.',
  'error.network': 'Could not connect to the server. Please check your internet connection.',
  'leaderboard.topScore': 'Top Score',
  'nav.game': 'Game',
};

const translations: Record<Language, Translations> = { de, en };

let currentLanguage: Language = detectInitialLanguage();

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem('language');
  if (stored === 'de' || stored === 'en') {
    return stored;
  }

  const browserLang = navigator.language.slice(0, 2);
  return browserLang === 'de' ? 'de' : 'en';
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
}

export function t(key: TranslationKey): string {
  return translations[currentLanguage][key];
}