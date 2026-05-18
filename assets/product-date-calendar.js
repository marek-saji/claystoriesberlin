/**
 * Progressive enhancement for the product form's "Date" variant option.
 *
 * - Hides past-date radios (replaces what used to live inline in product.liquid).
 * - When more than 5 future dates are available, hides the radio list and
 *   renders a month/week calendar over the same set of radios. The radios
 *   remain the source of truth — selecting a slot just checks one and
 *   dispatches `change`, so the existing updateVariant() pipeline keeps
 *   working unchanged.
 *
 * Runs at `defer` time: after HTML parsing, before DOMContentLoaded — so the
 * inline `#variant-data` JSON is already on the page, and the inline DCL
 * handler that calls updateVariant() runs afterwards (and sees a clean
 * radio state).
 */

(() => {
  const LOCALE = document.documentElement.lang || "en-GB";
  const WEEKDAYS = (() => {
    const shortFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short" });
    const longFmt = new Intl.DateTimeFormat(LOCALE, { weekday: "long" });
    // 2024-01-01 is a Monday — gives us Mon..Sun in order.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + i);
      return { short: shortFmt.format(d), long: longFmt.format(d) };
    });
  })();

  const fieldset = document.getElementById("product-form-fieldset");
  if (!fieldset) return;

  const dateGroup = findDateGroup(fieldset);
  if (!dateGroup) return;

  const variantData = readVariantData();
  const allSlots = collectSlots(dateGroup, variantData);
  if (allSlots.length === 0) return;

  const visibleSlots = allSlots.filter((s) => !s.label.hidden);

  if (visibleSlots.length === 0) {
    // Hide the (now-empty) date fieldset; updateVariant() will show the
    // shared #product-no-dates message on its next run.
    dateGroup.hidden = true;
    return;
  }

  // If the auto-checked first radio is now hidden, fall back to the first visible.
  // (Calendar mode below will undo this — it wants no initial selection.)
  const checked = dateGroup.querySelector(
    "input.product-option__radio:checked",
  );
  if (checked?.closest("label[data-date-end]")?.hidden) {
    checked.checked = false;
    const firstVisible = visibleSlots.find((s) => s.available);
    if (firstVisible) firstVisible.radio.checked = true;
  }

  if (visibleSlots.length <= 5) return;

  buildCalendar(
    dateGroup,
    visibleSlots.filter((s) => s.available),
  );

  // ---------------------------------------------------------------------------

  function findDateGroup(root) {
    for (const group of root.querySelectorAll(".product-option-group")) {
      if (group.querySelector("label[data-date-end]")) return group;
    }
    return null;
  }

  function readVariantData() {
    const el = document.getElementById("variant-data");
    if (!el) return [];
    try {
      return JSON.parse(el.textContent);
    } catch {
      return [];
    }
  }

  function collectSlots(group, variants) {
    const slots = [];
    for (const label of group.querySelectorAll("label[data-date-end]")) {
      const radio = label.querySelector("input.product-option__radio");
      if (!radio) continue;
      const [startStr, endStr] = String(radio.value).split(" - ");
      if (!startStr || !endStr) continue;
      const start = parseDateTime(startStr);
      const end = endStr.includes(" ")
        ? parseDateTime(endStr)
        : parseDateTime(`${startStr.split(" ")[0]} ${endStr}`);
      if (isNaN(start) || isNaN(end)) continue;
      const inventory = variants
        .filter(
          (v) =>
            v.available &&
            Array.isArray(v.options) &&
            v.options.includes(radio.value),
        )
        .reduce((sum, v) => sum + (Number(v.inventory_quantity) || 0), 0);
      slots.push({
        label,
        radio,
        start,
        end,
        inventory,
        available: !radio.disabled && inventory > 0,
      });
    }
    return slots;
  }

  function parseDateTime(s) {
    // "YYYY-MM-DD HH:MM" → local Date. Replace space with T for ISO-ish parsing.
    return new Date(s.replace(" ", "T"));
  }

  // ---------------------------------------------------------------------------
  // Calendar
  // ---------------------------------------------------------------------------

  function buildCalendar(originalGroup, slots) {
    // Calendar starts with nothing selected. Clear any preselected radio so
    // updateVariant() (called shortly after by the inline DCL handler) sees an
    // empty selection and disables the buy button.
    for (const s of slots) s.radio.checked = false;

    const slotsByDay = new Map(); // 'YYYY-MM-DD' -> [Slot, ...] sorted by start
    for (const s of slots) {
      const key = dayKey(s.start);
      if (!slotsByDay.has(key)) slotsByDay.set(key, []);
      slotsByDay.get(key).push(s);
    }
    for (const arr of slotsByDay.values())
      arr.sort((a, b) => a.start - b.start);

    const sortedDays = [...slotsByDay.keys()].sort();
    const firstMonth = sortedDays[0].slice(0, 7);
    const lastMonth = sortedDays[sortedDays.length - 1].slice(0, 7);

    // Sorted list of Monday-keys for weeks that contain at least one available
    // day. Used to step the prev/next arrows in week view, skipping empty weeks.
    const weeksWithSlots = (() => {
      const set = new Set();
      for (const d of sortedDays) set.add(mondayOf(d));
      return [...set].sort();
    })();

    let currentMonth = firstMonth; // 'YYYY-MM'
    let view = "month"; // 'month' | 'week'
    let selectedDay = null; // 'YYYY-MM-DD' or null

    const container = document.createElement("div");
    container.className = "date-calendar";
    originalGroup.hidden = true;
    originalGroup.setAttribute("aria-hidden", "true");
    originalGroup.after(container);

    container.addEventListener("click", onClick);
    render();

    // -------------------------------------------------------------------------

    function render() {
      container.dataset.view = view;
      const [year, monthIdx] = currentMonth.split("-").map(Number);
      const monthDate = new Date(year, monthIdx - 1, 1);
      const monthName = monthDate.toLocaleString(LOCALE, { month: "long" });
      const monthIsButton = view === "week";

      let prevDisabled, nextDisabled, navLabel;
      if (view === "week") {
        const weekIdx = weeksWithSlots.indexOf(mondayOf(selectedDay));
        prevDisabled = weekIdx <= 0;
        nextDisabled = weekIdx === weeksWithSlots.length - 1;
        navLabel = "Change week";
      } else {
        prevDisabled = currentMonth === firstMonth;
        nextDisabled = currentMonth === lastMonth;
        navLabel = "Change month";
      }

      container.innerHTML = `
        <header class="date-calendar__header">
          <div class="date-calendar__title">
            ${
              monthIsButton
                ? `<button type="button" class="date-calendar__month date-calendar__month--button" aria-label="Back to month view">${monthName}</button>`
                : `<h3 class="date-calendar__month">${monthName}</h3>`
            }
            <span class="date-calendar__year">${year}</span>
          </div>
          <nav class="date-calendar__nav" aria-label="${navLabel}">
            <button type="button" class="date-calendar__nav-btn" data-dir="prev" aria-label="Previous ${view}"${prevDisabled ? ` disabled title="No previous available dates"` : ""}>‹</button>
            <button type="button" class="date-calendar__nav-btn" data-dir="next" aria-label="Next ${view}"${nextDisabled ? ` disabled title="No next available dates"` : ""}>›</button>
          </nav>
        </header>
        <div class="date-calendar__weekdays" role="row">
          ${WEEKDAYS.map((d) => `<abbr class="date-calendar__weekday" role="columnheader" title="${d.long}">${d.short}</abbr>`).join("")}
        </div>
        <div class="date-calendar__grid">
          ${view === "month" ? renderMonthGrid(year, monthIdx) : renderWeekStrip()}
        </div>
        ${view === "week" ? renderSlotList() : ""}
      `;
    }

    function renderMonthGrid(year, monthIdx) {
      const firstOfMonth = new Date(year, monthIdx - 1, 1);
      const daysInMonth = new Date(year, monthIdx, 0).getDate();
      const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Mon-first
      const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;

      let html = "";
      for (let row = 0; row < totalCells / 7; row++) {
        let rowHtml = "";
        for (let col = 0; col < 7; col++) {
          const cellIdx = row * 7 + col;
          const dayNum = cellIdx - leadingBlanks + 1;
          if (dayNum < 1 || dayNum > daysInMonth) {
            rowHtml +=
              '<div class="date-calendar__day date-calendar__day--blank" aria-hidden="true"></div>';
          } else {
            rowHtml += dayCellHtml(year, monthIdx, dayNum);
          }
        }
        html += `<div class="date-calendar__week" role="row" style="view-transition-name: cal-row-${row}">${rowHtml}</div>`;
      }
      return html;
    }

    function renderWeekStrip() {
      const [y, m, d] = selectedDay.split("-").map(Number);
      const dayDate = new Date(y, m - 1, d);
      const weekdayMon0 = (dayDate.getDay() + 6) % 7;
      const monday = new Date(y, m - 1, d - weekdayMon0);

      // Reuse the same view-transition-name as the matching row in month view.
      const [year, monthIdx] = currentMonth.split("-").map(Number);
      const firstOfMonth = new Date(year, monthIdx - 1, 1);
      const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
      const dayOffset = Math.round((dayDate - firstOfMonth) / 86400000);
      const rowIdx = Math.floor((dayOffset + leadingBlanks) / 7);

      let cells = "";
      for (let i = 0; i < 7; i++) {
        const c = new Date(monday);
        c.setDate(monday.getDate() + i);
        cells += dayCellHtml(c.getFullYear(), c.getMonth() + 1, c.getDate());
      }
      return `<div class="date-calendar__week date-calendar__week--strip" role="row" style="view-transition-name: cal-row-${rowIdx}">${cells}</div>`;
    }

    function dayCellHtml(year, monthIdx, dayNum) {
      const key = `${year}-${pad2(monthIdx)}-${pad2(dayNum)}`;
      const daySlots = slotsByDay.get(key) || [];
      const today = startOfToday();
      const cellDate = new Date(year, monthIdx - 1, dayNum);
      const isPast = cellDate < today;
      const hasSlots = daySlots.length > 0 && !isPast;
      const isSelected = key === selectedDay;

      const dots = hasSlots
        ? `<span class="date-calendar__dots" aria-hidden="true">${'<span class="date-calendar__dot"></span>'.repeat(
            daySlots.length,
          )}</span>`
        : "";

      const cls = [
        "date-calendar__day",
        isPast && "date-calendar__day--past",
        !hasSlots && !isPast && "date-calendar__day--empty",
        isSelected && "date-calendar__day--selected",
      ]
        .filter(Boolean)
        .join(" ");

      const label =
        formatLongDate(year, monthIdx, dayNum) +
        (hasSlots
          ? `, ${daySlots.length} time${daySlots.length === 1 ? "" : "s"} available`
          : "");

      return `<button type="button" class="${cls}" ${hasSlots ? "" : "disabled"} data-day="${key}" aria-label="${label}" aria-pressed="${isSelected}">
        <span class="date-calendar__day-num">${dayNum}</span>
        ${dots}
      </button>`;
    }

    function renderSlotList() {
      const daySlots = slotsByDay.get(selectedDay) || [];
      const items = daySlots
        .map((s, i) => {
          const isSelected = s.radio.checked;
          const cls =
            "date-calendar__slot" +
            (isSelected ? " date-calendar__slot--selected" : "");
          return `<button type="button" class="${cls}" data-day="${selectedDay}" data-idx="${i}" aria-pressed="${isSelected}">
          <span class="date-calendar__slot-time">${formatTime(s.start)}</span>
          <span class="date-calendar__slot-availability">${s.inventory} available</span>
        </button>`;
        })
        .join("");
      return `<div class="date-calendar__slots" role="list">${items}</div>`;
    }

    // -------------------------------------------------------------------------

    function onClick(e) {
      const navBtn = e.target.closest(".date-calendar__nav-btn");
      if (navBtn && !navBtn.disabled)
        return navigate(navBtn.dataset.dir === "prev" ? -1 : 1);

      const monthBtn = e.target.closest(".date-calendar__month--button");
      if (monthBtn) return backToMonth();

      const dayBtn = e.target.closest(".date-calendar__day");
      if (dayBtn && !dayBtn.disabled) return selectDay(dayBtn.dataset.day);

      const slotBtn = e.target.closest(".date-calendar__slot");
      if (slotBtn)
        return selectSlot(slotBtn.dataset.day, Number(slotBtn.dataset.idx));
    }

    function navigate(delta) {
      if (view === "week") {
        const weekIdx = weeksWithSlots.indexOf(mondayOf(selectedDay));
        const targetIdx = weekIdx + delta;
        if (targetIdx < 0 || targetIdx >= weeksWithSlots.length) return;
        const targetMonday = weeksWithSlots[targetIdx];
        // Jump to the first available day in that week.
        selectedDay = sortedDays.find((d) => mondayOf(d) === targetMonday);
        currentMonth = selectedDay.slice(0, 7);
        render();
        return;
      }
      // Month view: step calendar months, snapping inside the available range.
      let [y, m] = currentMonth.split("-").map(Number);
      m += delta;
      if (m < 1) {
        m = 12;
        y--;
      }
      if (m > 12) {
        m = 1;
        y++;
      }
      const next = `${y}-${pad2(m)}`;
      if (next < firstMonth || next > lastMonth) return;
      currentMonth = next;
      render();
    }

    function selectDay(day) {
      selectedDay = day;
      // If the clicked day lives in a different month (week strip can span
      // months), keep the header in sync.
      const targetMonth = day.slice(0, 7);
      if (
        targetMonth !== currentMonth &&
        targetMonth >= firstMonth &&
        targetMonth <= lastMonth
      ) {
        currentMonth = targetMonth;
      }
      transition(() => {
        view = "week";
        render();
      });
    }

    function backToMonth() {
      // Returning to the month view drops the current slot pick so the buy
      // button reflects "nothing chosen yet" again.
      let hadSelection = false;
      for (const arr of slotsByDay.values()) {
        for (const s of arr) {
          if (s.radio.checked) {
            s.radio.checked = false;
            hadSelection = true;
          }
        }
      }
      if (hadSelection) {
        // Re-run the variant pipeline so price/buy button update.
        document
          .querySelector(".product-option__radio")
          ?.dispatchEvent(new Event("change", { bubbles: true }));
      }
      transition(() => {
        view = "month";
        selectedDay = null;
        render();
      });
    }

    function selectSlot(day, idx) {
      const slot = (slotsByDay.get(day) || [])[idx];
      if (!slot) return;
      for (const arr of slotsByDay.values())
        for (const s of arr) s.radio.checked = false;
      slot.radio.checked = true;
      slot.radio.dispatchEvent(new Event("change", { bubbles: true }));
      // Update slot button states without a full re-render so we don't reset
      // the scroll/animation.
      for (const btn of container.querySelectorAll(".date-calendar__slot")) {
        const isThis =
          btn.dataset.day === day && Number(btn.dataset.idx) === idx;
        btn.classList.toggle("date-calendar__slot--selected", isThis);
        btn.setAttribute("aria-pressed", String(isThis));
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Pure helpers
  // ---------------------------------------------------------------------------

  function transition(fn) {
    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(fn);
    } else {
      fn();
    }
  }

  function dayKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  // Monday-of-week key for grouping days into navigable weeks (Mon-first).
  function mondayOf(dayKeyStr) {
    const [y, m, d] = dayKeyStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return dayKey(date);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function startOfToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }

  function formatTime(date) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  function formatLongDate(year, monthIdx, dayNum) {
    return new Date(year, monthIdx - 1, dayNum).toLocaleDateString(LOCALE, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
})();
