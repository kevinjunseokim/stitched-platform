// Stitched — root component. Owns URL state, modal state, and the
// authentication lifecycle; everything else lives in dedicated modules under
// `src/`. The actual data layer (items, feed, follows, etc.) is provided by
// `AppDataProvider`, which `App` wraps the tree with.

import { useCallback, useEffect, useState } from 'react';

import './styles.css';

import { apiRequest } from './api/client';
import { clearStoredAuth, readStoredAuth, storeAuth } from './api/storage';
import { AppShell } from './components/shell/AppShell';
import { AppDataProvider } from './context/AppDataProvider';
import { useApp } from './context/AppDataContext';
import { findItem, findPlayer } from './data/mocks';
import { AddItemScreen } from './screens/add-item/AddItemScreen';
import { AuthScreen } from './screens/auth/AuthScreen';
import { CollectionScreen } from './screens/collection/CollectionScreen';
import { CompsTableScreen } from './screens/comps/CompsTableScreen';
import { FeedScreen } from './screens/feed/FeedScreen';
import { ItemDetailScreen } from './screens/item/ItemDetailScreen';
import { LandingScreen } from './screens/landing/LandingScreen';
import { MobilePreview } from './screens/mobile/MobilePreview';
import { PlayerScreen } from './screens/player/PlayerScreen';
import { PlayersIndexScreen } from './screens/players/PlayersIndexScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { SearchScreen } from './screens/search/SearchScreen';
import { WatchlistScreen } from './screens/watchlist/WatchlistScreen';
import { isAuthenticated, requiresAuth } from './utils/authSession';
import {
  DEFAULT_ITEM_ID,
  DEFAULT_PLAYER_ID,
  buildPath,
  parsePath,
} from './utils/routing';

export default function App() {
  const initial = parsePath(window.location.pathname);
  const [route, setRoute] = useState(initial.route);
  const [itemId, setItemId] = useState(initial.itemId || DEFAULT_ITEM_ID);
  const [playerId, setPlayerId] = useState(initial.playerId || DEFAULT_PLAYER_ID);
  const [profileHandle, setProfileHandle] = useState(initial.profileHandle);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [addOpen, setAddOpen] = useState(false);
  const [auth, setAuth] = useState(() => readStoredAuth());

  const navigate = useCallback((nextRoute, { itemId: nextItemId, playerId: nextPlayerId, profileHandle: nextProfileHandle, replace = false } = {}) => {
    let actualRoute = nextRoute;
    let resolvedItemId = itemId;
    let resolvedPlayerId = playerId;
    let resolvedProfileHandle = profileHandle;

    if (nextItemId !== undefined) resolvedItemId = nextItemId;
    if (nextPlayerId !== undefined) resolvedPlayerId = nextPlayerId;
    if (actualRoute === 'profile' && nextProfileHandle === undefined) {
      // Header "my profile" — clear any previously viewed collector handle.
      resolvedProfileHandle = undefined;
    } else if (nextProfileHandle !== undefined) {
      resolvedProfileHandle = nextProfileHandle;
    }

    const path = buildPath(actualRoute, {
      itemId: resolvedItemId,
      playerId: resolvedPlayerId,
      profileHandle: resolvedProfileHandle,
    });
    const state = {
      route: actualRoute,
      itemId: resolvedItemId,
      playerId: resolvedPlayerId,
      profileHandle: resolvedProfileHandle,
    };
    if (replace) window.history.replaceState(state, '', path);
    else window.history.pushState(state, '', path);

    setItemId(resolvedItemId);
    setPlayerId(resolvedPlayerId);
    setProfileHandle(resolvedProfileHandle);
    setRoute(actualRoute);
  }, [itemId, playerId, profileHandle]);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parsePath(window.location.pathname);
      setRoute(parsed.route);
      if (parsed.itemId) setItemId(parsed.itemId);
      if (parsed.playerId) setPlayerId(parsed.playerId);
      if ('profileHandle' in parsed) setProfileHandle(parsed.profileHandle);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route, itemId, playerId, profileHandle]);

  const openAuth = useCallback((mode = 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const openItem = useCallback((id) => navigate('item', { itemId: id }), [navigate]);
  const openPlayer = useCallback((id) => navigate('player', { playerId: id }), [navigate]);

  const signOut = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
    navigate('landing');
  }, [navigate]);

  // Auth flow uses the raw apiRequest so we can short-circuit on the
  // "confirmation required" branch before pushing a token into storage.
  const handleAuth = useCallback(async (payload) => {
    const endpoint = payload.mode === 'signup' ? '/api/register' : '/api/login';
    const body = payload.mode === 'signup'
      ? { displayName: payload.displayName, email: payload.email, password: payload.password }
      : { email: payload.email, password: payload.password };

    const nextAuth = await apiRequest(endpoint, { method: 'POST', body });

    if (!nextAuth.access_token) {
      return {
        confirmationRequired: true,
        message: nextAuth.message || 'Account created. Check your email to confirm before signing in.',
      };
    }

    storeAuth(nextAuth);
    setAuth(nextAuth);
    setAuthOpen(false);
    navigate('feed');
    return { confirmationRequired: false };
  }, [navigate]);

  return (
    <AppDataProvider
      auth={auth}
      setAuth={setAuth}
      openAuth={openAuth}
      openItem={openItem}
      openPlayer={openPlayer}
      navigate={navigate}
      signOut={signOut}>
      <AppRoot
        route={route}
        itemId={itemId}
        playerId={playerId}
        profileHandle={profileHandle}
        authOpen={authOpen}
        authMode={authMode}
        addOpen={addOpen}
        openAuth={openAuth}
        openItem={openItem}
        openPlayer={openPlayer}
        onAuth={handleAuth}
        onCloseAuth={() => setAuthOpen(false)}
        onOpenAdd={() => setAddOpen(true)}
        onCloseAdd={() => setAddOpen(false)}
        navigate={navigate}/>
    </AppDataProvider>
  );
}

// Sits inside the provider so it can read AppDataContext (for live titles and
// dispatching saves into shared state). Pure routing — no API or auth logic.
function AppRoot({
  route,
  itemId,
  playerId,
  profileHandle,
  authOpen,
  authMode,
  addOpen,
  openAuth,
  openItem,
  openPlayer,
  onAuth,
  onCloseAuth,
  onOpenAdd,
  onCloseAdd,
  navigate,
}) {
  const ctx = useApp();
  const { auth, sessionReady } = ctx;
  const authed = isAuthenticated(auth);

  useEffect(() => {
    if (!sessionReady) return;
    if (route === 'landing' || route === 'mobile') return;
    if (!authed) navigate('landing', { replace: true });
  }, [sessionReady, route, authed, navigate]);

  const saveItem = useCallback(async (data) => {
    if (!ctx.auth?.access_token) {
      openAuth('signin');
      throw new Error('Create an account or sign in before saving an item.');
    }
    const { item } = await ctx.api.createItem(data);
    ctx.addPersistedItem?.(item);
    onCloseAdd();
    ctx.refreshFeed();
    ctx.refreshCollectionSummary();
    navigate('collection', { itemId: item.id });
  }, [ctx, navigate, onCloseAdd, openAuth]);

  if (route === 'mobile') {
    return <MobilePreview/>;
  }

  const showLanding = route === 'landing' || (requiresAuth(route) && sessionReady && !authed);

  if (showLanding) {
    return (
      <>
        <LandingScreen
          onSignIn={() => openAuth('signin')}
          onSignUp={() => openAuth('signup')}/>
        {authOpen && (
          <AuthScreen
            key={authMode}
            initialMode={authMode}
            onAuth={onAuth}
            onClose={onCloseAuth}/>
        )}
      </>
    );
  }

  if (requiresAuth(route) && !sessionReady) {
    return null;
  }

  return (
    <>
      <AuthenticatedShell
        route={route}
        itemId={itemId}
        playerId={playerId}
        onNav={(r) => navigate(r)}
        onAdd={onOpenAdd}
        onSearch={() => navigate('search')}
        onBackCollection={() => navigate('collection')}
        onBackPlayers={() => navigate('players')}
        profileHandle={profileHandle}
        openItem={openItem}
        openPlayer={openPlayer}
        openProfile={(handle) => navigate('profile', { profileHandle: handle })}/>
      {authOpen && (
        <AuthScreen
          key={authMode}
          initialMode={authMode}
          onAuth={onAuth}
          onClose={onCloseAuth}/>
      )}
      {addOpen && (
        <AddItemScreen onCancel={onCloseAdd} onDone={saveItem}/>
      )}
    </>
  );
}

// Authenticated layout: reads context for live counts/titles and dispatches to
// the appropriate screen module.
function AuthenticatedShell({
  route,
  itemId,
  playerId,
  onNav,
  onAdd,
  onSearch,
  onBackCollection,
  onBackPlayers,
  profileHandle,
  openItem,
  openPlayer,
  openProfile,
}) {
  const { user, ticker, items } = useApp();

  const titles = {
    feed: 'Home',
    collection: 'My collection',
    item: findItem(itemId)?.title || 'Item detail',
    players: 'Player indexes',
    player: findPlayer(playerId).name,
    search: 'Search',
    comps: 'Auction comps',
    watchlist: 'Watchlist & alerts',
  };

  const screen = (() => {
    switch (route) {
      case 'feed': return <FeedScreen onItem={openItem} onPlayer={openPlayer} onProfile={openProfile} onAdd={onAdd}/>;
      case 'collection': return <CollectionScreen onItem={openItem} onAdd={onAdd} items={items}/>;
      case 'item': return <ItemDetailScreen id={itemId} onPlayer={openPlayer} onProfile={openProfile} onBack={onBackCollection}/>;
      case 'players': return <PlayersIndexScreen onPlayer={openPlayer}/>;
      case 'player': return <PlayerScreen id={playerId} onItem={openItem} onPlayer={openPlayer} onBack={onBackPlayers}/>;
      case 'search': return <SearchScreen onItem={openItem} onPlayer={openPlayer} onProfile={openProfile}/>;
      case 'comps': return <CompsTableScreen onPlayer={openPlayer}/>;
      case 'profile': return <ProfileScreen profileHandle={profileHandle} onItem={openItem} onPlayer={openPlayer}/>;
      case 'watchlist': return <WatchlistScreen onPlayer={openPlayer}/>;
      default: return <FeedScreen onItem={openItem} onPlayer={openPlayer}/>;
    }
  })();

  const pageTitle = route === 'profile' ? null : (titles[route] ?? titles.feed);
  const navActive = route === 'item' ? 'collection' : route === 'player' ? 'players' : route;

  return (
    <AppShell
      active={navActive}
      onNav={onNav}
      onAdd={onAdd}
      onSearch={onSearch}
      title={pageTitle}
      user={user}
      tickerItems={ticker}>
      {screen}
    </AppShell>
  );
}
