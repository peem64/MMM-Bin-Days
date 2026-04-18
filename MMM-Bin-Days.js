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

  binSwatch: function (color) {
    const swatch = document.createElement("span");
    swatch.className = "bindays-swatch";
    swatch.style.backgroundColor = color || "#888";
    return swatch;
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
