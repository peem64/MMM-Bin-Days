const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-Bin-Days helper started.");
  },

  socketNotificationReceived: async function (notification, payload) {
    if (notification !== "BINDAYS_FETCH") return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const limit = payload.maxCollections || 10;

      const url =
        payload.supabaseUrl.replace(/\/$/, "") +
        "/rest/v1/bin_collections" +
        `?select=id,bin_type,bin_color,collection_date` +
        `&collection_date=gte.${today}` +
        `&order=collection_date.asc` +
        `&limit=${limit * 2}`;

      const response = await fetch(url, {
        headers: {
          apikey: payload.supabaseAnonKey,
          Authorization: `Bearer ${payload.supabaseAnonKey}`
        }
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Supabase responded ${response.status}: ${body.slice(0, 200)}`
        );
      }

      const collections = await response.json();
      this.sendSocketNotification("BINDAYS_DATA", { collections });
    } catch (err) {
      this.sendSocketNotification("BINDAYS_ERROR", {
        message: err && err.message ? err.message : String(err)
      });
    }
  }
});
