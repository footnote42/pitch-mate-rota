# Squad Rotation Tool - Requirements Document

## Project Overview
A web-based application to manage player rotations for U10 rugby festival games, ensuring fair playing time and balanced team experience levels.

## Current Context
- **Developer Experience**: HTML, CSS, JavaScript, JSON. Built Pong clone with Copilot assistance
- **Available Time**: Few hours on weekends, limited evenings
- **First Festival**: 2 weeks away
- **Typical Setup**: 5 games per festival, 13 players in squad, 8 on pitch at once, 4 subs rotate at half-time

## Core Rules & Constraints
- **RFU Half Game Rule**: All players must get at least half of available playing time
- **Team Balance**: Avoid swapping all experienced players for all novices
- **Equal Distribution**: Share playable halves equally (accepting some players may get one more half than others)

---

## User Stories

### Phase 1 (MVP - Target: Weekends 1-3)
1. **As a coach**, I need to add player names to my squad so I can track who's available
2. **As a coach**, I need to mark players as experienced or novice so I can balance the team
3. **As a coach**, I need to see a grid showing all players and all game halves so I can plan rotations
4. **As a coach**, I need to click on cells to assign players to specific halves so I can build my rota
5. **As a coach**, I need to see how many halves each player has been assigned so I can ensure fairness
6. **As a coach**, I need visual warnings when a half has too many novices so I can rebalance

### Phase 2 (Enhanced - Target: Weekends 4-5)
7. **As a coach**, I need to quickly swap players between halves during the festival so I can handle changes
8. **As a coach**, I need to mark a player as absent/injured mid-festival so the system adjusts
9. **As a coach**, I need the app to work on my phone without internet so I can use it pitchside
10. **As a coach**, I need to save my rota so I don't lose my work

### Phase 3 (Future Enhancements)
11. **As a coach**, I need to adjust the number of games in a festival
12. **As a coach**, I need to adjust squad size and players-on-pitch for different age groups
13. **As a coach**, I need to share the rota with co-coaches and parents
14. **As a coach**, I need to see historical rotas from previous festivals

---

## Technical Requirements

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Browser LocalStorage (Phase 2)
- **Development Environment**: VS Code with GitHub Copilot
- **Target Devices**: Mobile-first (iPhone/Android browsers), tablet, desktop

### Core Features (Phase 1 - MVP)

#### 1. Player Management
- Add/remove players from squad
- Assign experience level to each player (toggle: Experienced/Novice)
- Display current squad list with experience indicators

#### 2. Rota Grid Display
- Grid layout: Rows = Players, Columns = Game halves
- Default: 5 games = 10 halves (5 "First Half", 5 "Second Half")
- Clear visual separation between games
- Mobile-responsive design

#### 3. Assignment Functionality
- Click cell to toggle player assignment (on/off/empty)
- Visual distinction for assigned vs unassigned cells
- Ensure exactly 8 players per half (validation)

#### 4. Fairness Tracking
- Display running total of halves played per player
- Highlight players who haven't met minimum (5 halves for 10-half festival)
- Highlight players approaching maximum fair share

#### 5. Balance Checking
- Count experienced vs novice players in each half
- Visual warning if half has < 3 experienced players (adjustable threshold)
- Color-coding for balance status (good/warning/critical)

### Enhanced Features (Phase 2)

#### 6. Data Persistence
- Save rota to browser LocalStorage
- Auto-save on changes
- Load last saved rota on app open

#### 7. Flexible Management
- Drag-and-drop player swapping between halves
- Quick "mark as injured/absent" button per player
- System recalculates fairness when player removed

#### 8. Offline Capability
- Works without internet connection
- All functionality available offline

### Future Features (Phase 3)
- Adjustable number of games (3-8 games)
- Adjustable squad size and players-on-pitch
- Export rota as text/image for sharing
- Multiple saved festivals
- Auto-suggest balanced rotations

---

## Development Phases

### **Phase 1: MVP (Weekends 1-3) - ~15-18 hours**

#### Weekend 1: Setup & Player Management (5-6 hours)
- [ ] Set up project structure (HTML, CSS, JS files)
- [ ] Create basic page layout with header
- [ ] Build player input form (name + experience toggle)
- [ ] Display player list with remove buttons
- [ ] Style for mobile-first design
- [ ] Test adding/removing players

#### Weekend 2: Grid System (5-6 hours)
- [ ] Create grid structure (13 rows × 10 columns)
- [ ] Add game/half labels to columns
- [ ] Implement click-to-assign functionality
- [ ] Add visual states (empty/assigned/current)
- [ ] Ensure mobile scrolling works smoothly
- [ ] Test on actual phone

#### Weekend 3: Fairness & Balance (5-6 hours)
- [ ] Add halves-played counter per player
- [ ] Highlight players below minimum (5 halves)
- [ ] Count experienced vs novice per half
- [ ] Add visual warnings for unbalanced halves
- [ ] Validate 8 players per half
- [ ] Testing with realistic festival data

**Deliverable**: Working web page you can use at a festival (even if manually managing it)

### **Phase 2: Enhanced Version (Weekends 4-5) - ~8-10 hours**

#### Weekend 4: Data Persistence (4-5 hours)
- [ ] Implement LocalStorage save/load
- [ ] Add "Clear All" and "Reset" buttons
- [ ] Auto-save on every change
- [ ] Test persistence across browser sessions

#### Weekend 5: Flexibility & Polish (4-5 hours)
- [ ] Add player absence toggle (grays out player)
- [ ] Improve mobile UI/UX
- [ ] Add instructions/help text
- [ ] Final testing and bug fixes

**Deliverable**: Robust app with save functionality and injury management

### **Phase 3: Future Enhancements (As needed)**
- Configurable settings
- Sharing capabilities
- Historical data
- Advanced auto-suggestion

---

## Success Criteria

### Phase 1 (MVP)
- ✅ Can add 13 players with experience levels
- ✅ Can assign players to halves via clicking
- ✅ Can see at a glance who's playing when
- ✅ Get warnings about unbalanced halves
- ✅ Can track fairness of playing time
- ✅ Works on mobile phone

### Phase 2 (Enhanced)
- ✅ Rota persists between sessions
- ✅ Can handle mid-festival changes
- ✅ Smooth user experience

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 2-week deadline too tight | High | Focus on learning; aim for festival after next |
| Mobile layout challenges | Medium | Test on phone from weekend 1 |
| Logic bugs in fairness checking | Medium | Test with paper rota examples |
| Limited evening time | Low | Clear weekend tasks; use Copilot effectively |

---

## Next Steps

1. **This Week**: Set up project folder, create basic HTML structure, experiment with grid layouts
2. **Weekend 1**: Follow Phase 1, Weekend 1 checklist
3. **Review**: After each weekend, assess progress and adjust timeline
4. **First Festival (2 weeks)**: Use paper backup, but test app if ready
5. **Subsequent Festivals**: Iterate and improve based on real usage

---

## Notes
- Keep code simple and well-commented for learning
- Use Copilot to explain concepts you don't understand
- Commit to GitHub regularly (optional but recommended)
- Don't aim for perfection - working software beats perfect software
- Each phase delivers value; you can stop at any phase and still have something useful