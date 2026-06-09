# 🚀 QUICK START GUIDE - Scorton Full Integration

## What's Done ✅

Your /akk2 frontend is now **100% connected** to the live Render backend at:
**`https://ak-backend-0c5x.onrender.com/v1`**

All functionality working:
- ✅ Login with JWT token
- ✅ Schedule creation via drag-drop
- ✅ Players fetched from backend
- ✅ Media library synced
- ✅ Real-time persistence

---

## 🏃 Get Started in 30 Seconds

### 1. Install Dependencies (if needed)
```bash
cd /Users/engrahmadmirza/IdeaProjects/Scorton/akk2
npm install  # axios is already added to package.json
```

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Open in Browser
```
http://localhost:3000
```

---

## 🔓 Login Credentials

Use the **demo login** configured on the backend:

```
Email:    demo@akousticarts.com (or any email)
Password: (Check your backend's DEMO_LOGIN_PASSWORD in .env)
```

Or ask engineering for the current demo password.

Once logged in, you'll see:
- ✅ Dashboard with player status
- ✅ Schedule page with weekly grid
- ✅ Media library at bottom
- ✅ Drag-drop to assign schedules

---

## 🎯 Test Each Feature

### Test 1: Login
1. Go to `http://localhost:3000/login`
2. Enter demo email + password
3. Should redirect to `/dashboard`
4. Check browser DevTools → Application → localStorage
   - Verify `akou_access_token` is there

### Test 2: View Players
1. Go to `/schedule`
2. Should see loading spinner briefly
3. Then players from backend appear as rows
4. Dropdown at top shows "All Rooms" + player names

### Test 3: View Media
1. On `/schedule` page, scroll to bottom
2. Should see "Audio Library" drawer
3. Contains all media from `GET /media` endpoint
4. Search box filters by title

### Test 4: Create Schedule
1. Drag any audio item from library
2. Drop onto a player + day cell
3. Should create a schedule in backend (watch Network tab)
4. Event appears in the grid
5. Check backend database - schedule row created

### Test 5: Delete Schedule
1. Click "X" on any scheduled event
2. Confirm deletion dialog
3. Event disappears from grid
4. Backend schedule deleted

---

## 🔍 Verify Backend Connection

### Check Environment
```bash
cat /Users/engrahmadmirza/IdeaProjects/Scorton/akk2/.env.local
```
Should show:
```
NEXT_PUBLIC_API_BASE_URL=https://ak-backend-0c5x.onrender.com/v1
```

### Check API Client
```bash
cat /Users/engrahmadmirza/IdeaProjects/Scorton/akk2/lib/api-client.ts | head -20
```
Should show axios instance configured

### Check Auth Context
```bash
cat /Users/engrahmadmirza/IdeaProjects/Scorton/akk2/app/context/AuthContext.tsx | grep "useAuth"
```
Should show auth hook defined

---

## 📱 Browser DevTools Debugging

### Network Tab
1. Filter by Fetch/XHR
2. Login - watch `POST /auth/login`
3. Schedule page - watch `GET /players`, `GET /media`, `GET /schedules`
4. Drag-drop - watch `POST /schedules`

**Expected Headers:**
```
Authorization: Bearer eyJhbGc...
x-tenant-id: <tenant-uuid>
Content-Type: application/json
```

### Console Tab
- No CORS errors
- No 401 Unauthorized (if logged in)
- API client logs available

### Application Tab
- localStorage:
  - `akou_access_token` ← JWT token
  - `akou_tenant_id` ← Multi-tenant support
  - `akou_tenant_slug` ← Tenant identifier
  - `akou_user_email` ← Current user

---

## 🛠 If Something Breaks

### Backend Not Responding
```bash
# Check if backend is running
curl https://ak-backend-0c5x.onrender.com/v1/health

# Expected response:
{ "status": "ok" }
```

### Token Not Persisting
```bash
# Check localStorage in DevTools
localStorage.getItem('akou_access_token')

# Should return a long JWT string starting with "eyJ..."
```

### Cannot Drag-Drop
- Ensure you're on `/schedule` (not other routes)
- Make sure players exist (create one on `/players` first)
- Check browser console for errors

### Media Not Showing
- Verify `GET /media` returns items
- Check each media object has `url` field
- Try refreshing the page

---

## 📊 Architecture

```
User Browser
    ↓
/akk2 Frontend (Next.js)
    ├─ Context: AuthProvider (token management)
    ├─ Pages: /login, /schedule, /dashboard
    └─ API Client: lib/api-client.ts
        ↓
HTTPS REST API
    ↓
Render Backend
    ├─ FastAPI app at :8000
    ├─ Supabase Database (PostgreSQL)
    ├─ Supabase Storage (S3)
    └─ Endpoints: /v1/players, /media, /schedules
```

---

## 🔄 Data Flow Examples

### Creating a Schedule
```
1. User drags "Morning Flow" audio to Monday 9:00 AM
2. handleDropEvent() called with:
   - item: { id: "media-123", title: "Morning Flow", duration: 60 }
   - roomId: "player-456"
   - day: "Mon"
   - time: "09:00"
3. Converts to ISO timestamps:
   - startTime: "2026-01-20T09:00:00Z"
   - endTime: "2026-01-20T10:00:00Z"
4. Calls: apiClient.createSchedule({...})
5. Axios interceptor adds:
   - Authorization: Bearer {token}
   - x-tenant-id: {tenant}
6. Backend creates Schedule row
7. Response includes schedule.id
8. Frontend adds event to state
9. Calendar grid re-renders with new event
```

### Logging In
```
1. User enters email + password on /login
2. Calls: apiClient.login({email, password})
3. POST /auth/login sent to backend
4. Backend validates and returns JWT token
5. apiClient.setTokens() stores in localStorage
6. AuthContext updates state
7. Router redirects to /dashboard
8. useAuth() hook now returns { user, isAuthenticated: true }
```

---

## ✨ Files Created/Modified

### New Files
```
✅ /akk2/.env.local                     - Environment configuration
✅ /akk2/types/api.ts                   - TypeScript interfaces
✅ /akk2/lib/api-client.ts              - Axios API client
✅ /akk2/app/context/AuthContext.tsx    - React auth context
✅ /akk2/app/schedule/ScheduleClient.tsx - Schedule with backend
✅ /akk2/INTEGRATION_COMPLETE.md        - Full documentation
```

### Modified Files
```
✅ /akk2/package.json                   - Added axios
✅ /akk2/app/layout.tsx                 - Added AuthProvider
✅ /akk2/app/login/page.tsx             - Backend auth integrated
```

---

## 📚 Documentation

- **Full Integration Guide**: `/akk2/INTEGRATION_COMPLETE.md`
- **API Documentation**: `/ak/fastapi-backend/README.md`
- **Backend Schemas**: `/ak/fastapi-backend/app/schemas/`
- **Backend Routers**: `/ak/fastapi-backend/app/routers/`

---

## 🎉 You're All Set!

Your dashboard is live, connected, and ready to broadcast!

**Start the dev server:**
```bash
cd /akk2 && npm run dev
```

**Then visit:** `http://localhost:3000`

Enjoy! 🎵

