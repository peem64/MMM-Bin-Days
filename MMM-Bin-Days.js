/* MagicMirror Module: MMM-Bin-Days
 * Displays upcoming bin collections sourced from a Supabase database.
 */

Module.register("MMM-Bin-Days", {
  defaults: {
    supabaseUrl: "",
    supabaseAnonKey: "",
    maxCollections: 6,
    updateInterval: 60 * 60 * 1000,
    animationSpeed: 800,
    dateFormat: "ddd D MMM",
    showHeader: true,
    headerText: "Bin Collections"
  },

  getStyles: function () {
    return ["MMM-Bin-Days.css"];
  },

  getHeader: function () {
    return this.config.showHeader ? this.config.headerText : null;
  },

  start: function () {
    this.collections = [];
    this.loaded = false;
    this.error = null;

    if (!this.config.supabaseUrl || !this.config.supabaseAnonKey) {
      this.error = "Missing supabaseUrl or supabaseAnonKey in config.";
      this.updateDom(this.config.animationSpeed);
      return;
    }

    this.scheduleUpdate();
    this.fetchCollections();
  },

  scheduleUpdate: function () {
    const self = this;
    setInterval(function () {
      self.fetchCollections();
    }, this.config.updateInterval);
  },

  fetchCollections: function () {
    this.sendSocketNotification("BINDAYS_FETCH", {
      supabaseUrl: this.config.supabaseUrl,
      supabaseAnonKey: this.config.supabaseAnonKey,
      maxCollections: this.config.maxCollections
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "BINDAYS_DATA") {
      this.collections = payload.collections || [];
      this.error = null;
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    } else if (notification === "BINDAYS_ERROR") {
      this.error = payload.message || "Failed to load bin collections.";
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  },

  formatDate: function (iso) {
    const date = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  },

  hexForColor: function (color) {
    if (!color) return "#6b7280";
    if (typeof color === "string" && color.charAt(0) === "#") return color;
    const map = {
      black: "#1f2937",
      blue: "#2563eb",
      green: "#16a34a",
      brown: "#92400e",
      red: "#dc2626",
      yellow: "#ca8a04",
      purple: "#7e22ce",
      gray: "#6b7280"
    };
    return map[String(color).toLowerCase()] || color;
  },

  binSwatch: function (color) {
    const hex = this.hexForColor(color);
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "bindays-bin-icon");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");

    const stroke = "rgba(0,0,0,0.4)";

    const handle = document.createElementNS(svgNs, "rect");
    handle.setAttribute("x", "2.5");
    handle.setAttribute("y", "6");
    handle.setAttribute("width", "19");
    handle.setAttribute("height", "2.2");
    handle.setAttribute("rx", "0.6");
    handle.setAttribute("fill", hex);
    handle.setAttribute("stroke", stroke);
    handle.setAttribute("stroke-width", "0.4");
    svg.appendChild(handle);

    const lid = document.createElementNS(svgNs, "path");
    lid.setAttribute(
      "d",
      "M6 2.2 H18 a1.3 1.3 0 0 1 1.3 1.3 V5 H4.7 V3.5 A1.3 1.3 0 0 1 6 2.2 Z"
    );
    lid.setAttribute("fill", hex);
    lid.setAttribute("stroke", stroke);
    lid.setAttribute("stroke-width", "0.4");
    svg.appendChild(lid);

    const body = document.createElementNS(svgNs, "path");
    body.setAttribute(
      "d",
      "M4.8 8.4 H19.2 L18.1 20.2 A1.4 1.4 0 0 1 16.7 21.5 H7.3 A1.4 1.4 0 0 1 5.9 20.2 Z"
    );
    body.setAttribute("fill", hex);
    body.setAttribute("stroke", "rgba(0,0,0,0.45)");
    body.setAttribute("stroke-width", "0.5");
    svg.appendChild(body);

    const ridges = [
      { x1: "9", x2: "8.4" },
      { x1: "12", x2: "12" },
      { x1: "15", x2: "15.6" }
    ];
    ridges.forEach((r) => {
      const line = document.createElementNS(svgNs, "line");
      line.setAttribute("x1", r.x1);
      line.setAttribute("y1", "10.5");
      line.setAttribute("x2", r.x2);
      line.setAttribute("y2", "19.5");
      line.setAttribute("stroke", "rgba(0,0,0,0.3)");
      line.setAttribute("stroke-width", "0.5");
      line.setAttribute("stroke-linecap", "round");
      svg.appendChild(line);
    });

    [8, 16].forEach((cx) => {
      const wheel = document.createElementNS(svgNs, "circle");
      wheel.setAttribute("cx", String(cx));
      wheel.setAttribute("cy", "22");
      wheel.setAttribute("r", "1.1");
      wheel.setAttribute("fill", "#111");
      wheel.setAttribute("stroke", "rgba(255,255,255,0.15)");
      wheel.setAttribute("stroke-width", "0.3");
      svg.appendChild(wheel);
    });

    return svg;
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "bindays";

    if (this.error) {
      wrapper.className += " bindays-error";
      wrapper.innerHTML = this.error;
      return wrapper;
    }

    if (!this.loaded) {
      wrapper.className += " bindays-loading dimmed light small";
      wrapper.innerHTML = "Loading bin collections...";
      return wrapper;
    }

    if (!this.collections.length) {
      wrapper.className += " bindays-empty dimmed light small";
      wrapper.innerHTML = "No upcoming collections.";
      return wrapper;
    }

    const grouped = {};
    for (const c of this.collections) {
      if (!grouped[c.collection_date]) grouped[c.collection_date] = [];
      grouped[c.collection_date].push(c);
    }

    const dates = Object.keys(grouped).sort().slice(0, this.config.maxCollections);

    const list = document.createElement("ul");
    list.className = "bindays-list";

    dates.forEach((date, idx) => {
      const row = document.createElement("li");
      row.className = "bindays-row" + (idx === 0 ? " bindays-row-next" : "");

      const dateCell = document.createElement("span");
      dateCell.className = "bindays-date";
      dateCell.innerText = this.formatDate(date);

      const binsCell = document.createElement("span");
      binsCell.className = "bindays-bins";

      grouped[date].forEach((bin) => {
        const chip = document.createElement("span");
        chip.className = "bindays-chip";
        chip.appendChild(this.binSwatch(bin.bin_color));
        const label = document.createElement("span");
        label.innerText = bin.bin_type;
        chip.appendChild(label);
        binsCell.appendChild(chip);
      });

      row.appendChild(dateCell);
      row.appendChild(binsCell);
      list.appendChild(row);
    });

    wrapper.appendChild(list);
    return wrapper;
  }
});
