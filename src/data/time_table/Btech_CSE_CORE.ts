export const timetableData = {
  class: "2CSE CSE 2",

  schedule: [
    {
      day: "Monday",
      slots: [
        { time: "09:30-10:25", subject: "LIBRARY/SELF STUDY", faculty: null, room: null },
        { time: "10:25-11:20", subject: "LIBRARY/SELF STUDY", faculty: null, room: null },
        { time: "12:20-01:15", subject: "PHY", faculty: "CL", room: "N-408" },
        { time: "01:15-02:10", subject: "LA", faculty: "MYD", room: "N-408" },
        {
          time: "02:30-03:25",
          batches: [
            { batch: "1", subject: "CF", faculty: "ND", room: "LAB-810" },
            { batch: "2", subject: "PHY", faculty: "SSS", room: "D-327" }
          ]
        },
        {
          time: "03:25-04:20",
          batches: [
            { batch: "1", subject: "CF", faculty: "ND", room: "LAB-810" },
            { batch: "2", subject: "PHY", faculty: "SSS", room: "D-327" }
          ]
        }
      ]
    },

    {
      day: "Tuesday",
      slots: [
        { time: "09:30-10:25", subject: "HOLIDAY", faculty: null, room: null },
        { time: "10:25-11:20", subject: "HOLIDAY", faculty: null, room: null },
        { time: "12:20-01:15", subject: "HOLIDAY", faculty: null, room: null },
        { time: "01:15-02:10", subject: "HOLIDAY", faculty: null, room: null },
        { time: "02:30-03:25", subject: "HOLIDAY", faculty: null, room: null },
        { time: "03:25-04:20", subject: "HOLIDAY", faculty: null, room: null }
      ]
    },

    {
      day: "Wednesday",
      slots: [
        { time: "09:30-10:25", subject: "PSOSM", faculty: "NP", room: "N-407" },
        { time: "10:25-11:20", subject: "LA", faculty: "MYD", room: "N-409" },
        { time: "12:20-01:15", subject: "OOP", faculty: "DP", room: "N-409" },
        { time: "01:15-02:10", subject: "CF", faculty: "RG", room: "N-409" },
        {
          time: "02:30-03:25",
          batches: [
            { batch: "1", subject: "ICT W/S", faculty: "LD", room: "D-314" },
            { batch: "2", subject: "CF", faculty: "ND", room: "LAB-211" }
          ]
        },
        {
          time: "03:25-04:20",
          batches: [
            { batch: "1", subject: "ICT W/S", faculty: "LD", room: "D-314" },
            { batch: "2", subject: "CF", faculty: "ND", room: "LAB-211" }
          ]
        }
      ]
    },

    {
      day: "Thursday",
      slots: [
        { time: "09:30-10:25", subject: "ACIS", faculty: "PT", room: "N-408" },
        { time: "10:25-11:20", subject: "PHY", faculty: "CL", room: "N-408" },
        { time: "12:20-01:15", subject: "LIBRARY/SELF STUDY", faculty: null, room: null },
        { time: "01:15-02:10", subject: "LIBRARY/SELF STUDY", faculty: null, room: null },
        { time: "02:30-03:25", subject: "LA", faculty: "MYD", room: "N-408" },
        { time: "03:25-04:20", subject: "PSOSM", faculty: "NP", room: "N-408" }
      ]
    },

    {
      day: "Friday",
      slots: [
        { time: "09:30-10:25", subject: "PSOSM", faculty: "NP", room: "N-409" },
        { time: "10:25-11:20", subject: "LA", faculty: "MYD", room: "N-409" },
        { time: "12:20-01:15", subject: "OOP", faculty: "DP", room: "N-408" },
        { time: "01:15-02:10", subject: "CF", faculty: "RG", room: "N-408" },
        {
          time: "02:30-03:25",
          batches: [
            { batch: "1", subject: "PHY", faculty: "HS", room: "D-326" },
            { batch: "2", subject: "OOP", faculty: "DS", room: "LAB-811" }
          ]
        },
        {
          time: "03:25-04:20",
          batches: [
            { batch: "1", subject: "PHY", faculty: "HS", room: "D-326" },
            { batch: "2", subject: "OOP", faculty: "DS", room: "LAB-811" }
          ]
        }
      ]
    },

    {
      day: "Saturday",
      slots: [
        {
          time: "09:30-10:25",
          batches: [
            { batch: "1", subject: "OOP", faculty: "DS", room: "LAB-210" },
            { batch: "2", subject: "ICT W/S", faculty: "LI", room: "D-314" }
          ]
        },
        { time: "10:25-11:20", subject: "ICT W/S", faculty: "LI", room: "D-314" },
        { time: "12:20-01:15", subject: "CF", faculty: "RG", room: "N-407" },
        { time: "01:15-02:10", subject: "PHY", faculty: "CL", room: "N-407" },
        { time: "03:25-04:20", subject: "ACIS", faculty: "PT", room: "N-407" }
      ]
    }
  ]
};