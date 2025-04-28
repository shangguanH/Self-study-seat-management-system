// /pages/reserve/index.js

// Get today's date in YYYY-MM-DD format
const today = new Date();
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const currentDate = formatDate(today);

// --- Data Simulation ---
// In a real app, this data would come from a backend API call
const allRoomsData = {
  '自习室A': { name: '自习室A', totalSeats: 12, hasCharging: true, isQuiet: true },
  '自习室B': { name: '自习室B', totalSeats: 8, hasCharging: false, isQuiet: false },
  '自习室C': { name: '自习室C', totalSeats: 10, hasCharging: true, isQuiet: true },
  '自习室D': { name: '自习室D', totalSeats: 15, hasCharging: false, isQuiet: true },
  '自习室E': { name: '自习室E', totalSeats: 20, hasCharging: true, isQuiet: false },
};

// Function to simulate fetching room details and seat status by name
function fetchRoomDetailsAndSeats(roomName) {
  return new Promise((resolve, reject) => {
    console.log(`Simulating fetch for: ${roomName}`);
    const roomDetails = allRoomsData[roomName];

    if (!roomDetails) {
      console.error(`Room data not found for "${roomName}" in simulation.`);
      setTimeout(() => reject(new Error(`Room "${roomName}" not found`)), 100); // Simulate delay
      return;
    }

    // Simulate initial seat statuses (replace with real API call)
    const seats = Array.from({ length: roomDetails.totalSeats }, (_, index) => {
      // Simple simulation: mark some seats as reserved by others
      const isReservedByOther = Math.random() < 0.3; // 30% chance reserved by someone else
      return {
        id: index,
        status: isReservedByOther ? 'reserved' : 'available', // 'available', 'reserved', 'userReserved'
      };
    });

    // Calculate simulated available seats (excluding user's own potential reservation)
    const availableCount = seats.filter(s => s.status === 'available').length;

    const fullData = {
      ...roomDetails,
      seats: seats,
      availableSeats: availableCount // Calculated available seats
    };

    console.log(`Simulated data fetched for ${roomName}:`, fullData);
    // Simulate network delay
    setTimeout(() => resolve(fullData), 400); // Simulate 400ms delay
  });
}
// --- End Data Simulation ---


Page({
  data: {
    roomName: '', // Set from options
    roomDetails: null, // Stores fetched details { name, totalSeats, hasCharging, isQuiet }
    totalSeats: 0, // Derived from fetched data
    availableSeats: 0, // Derived from fetched data (or real-time API)
    hasCharging: false, // Derived from fetched data
    isQuiet: false, // Derived from fetched data
    seats: [], // Seat status array, populated after fetch

    // --- Loading & Error State ---
    isLoading: true,
    errorMessage: '',

    // --- User's Current Reservation Info ---
    userSeatIndex: null, // Current user's confirmed seat index in THIS room
    userReservationDate: null,
    userReservationStartTime: null,
    userReservationEndTime: null,
    hasReservation: false, // Does user have a reservation in *any* room? (Set based on storage)
    // Note: We might refine hasReservation to be room-specific if needed, but global check is simpler first

    // --- Reservation Selection Modal State ---
    showReservationModal: false,
    selectedSeatIndex: null, // Index of seat being booked via modal
    selectedDate: currentDate,
    startTime: '09:00',
    endTime: '10:00',
    minDate: currentDate,
    // maxDate: '...',

    // --- Cancellation Confirmation Modal State ---
    showCancelModal: false,
    cancelModalMessage: '',
    seatIndexToCancel: null, // Index of seat being cancelled via modal
  },

  onLoad: function(options) {
    console.log('Reserve page onLoad options:', options);
    // 1. Get roomName (primary identifier)
    // Use decodeURIComponent in case the name has special characters passed via URL
    const roomName = options.roomName ? decodeURIComponent(options.roomName) : null;

    if (!roomName) {
      console.error('Error: Missing roomName parameter!');
      this.setData({
        isLoading: false,
        errorMessage: '无法加载自习室信息：缺少房间名称参数。'
      });
      wx.showToast({ title: '页面加载失败', icon: 'error', duration: 2500 });
      // Optionally navigate back
      // wx.navigateBack();
      return;
    }

    // 2. Set initial state (loading and the known roomName)
    this.setData({
      roomName: roomName,
      isLoading: true,
      errorMessage: '',
      selectedDate: currentDate, // Ensure defaults are set
      minDate: currentDate,     // Ensure defaults are set
    });

    // 3. Fetch room details and seat status based on roomName
    this.loadRoomData(roomName);
  },

  // --- Core Data Loading Function ---
  loadRoomData: function(roomName) {
    fetchRoomDetailsAndSeats(roomName)
      .then(fetchedData => {
        // 4. Data fetched successfully
        let localSeats = fetchedData.seats; // Initial seats from fetch (available/reserved)
        let currentUserReservation = wx.getStorageSync('userReservation');
        let userSeatIndex = null;
        let userReservationDate = null;
        let userReservationStartTime = null;
        let userReservationEndTime = null;
        let hasReservationInThisRoom = false; // Is the stored reservation for THIS room?

        // 5. Check if the stored reservation belongs to THIS room
        if (currentUserReservation && currentUserReservation.roomName === roomName && currentUserReservation.seatIndex !== undefined) {
          console.log(`User has reservation in this room (${roomName}), seat index: ${currentUserReservation.seatIndex}`);
          userSeatIndex = currentUserReservation.seatIndex;
          userReservationDate = currentUserReservation.date;
          userReservationStartTime = currentUserReservation.startTime;
          userReservationEndTime = currentUserReservation.endTime;
          hasReservationInThisRoom = true;

          // Mark the user's seat in the localSeats array
          if (localSeats[userSeatIndex]) {
            localSeats[userSeatIndex].status = 'userReserved';
          } else {
            console.warn("Stored userSeatIndex is out of bounds for fetched seats:", userSeatIndex);
            // This indicates inconsistency, maybe clear the storage?
            wx.removeStorageSync('userReservation');
            hasReservationInThisRoom = false;
            userSeatIndex = null; // Reset index
          }
        } else if (currentUserReservation && currentUserReservation.roomName !== roomName) {
            console.log(`User has reservation in another room: ${currentUserReservation.roomName}`);
            // Keep hasReservation true globally, but false for this room
        }

        // 6. Update page data with fetched and processed info
        this.setData({
          roomDetails: { // Store static details
            name: fetchedData.name,
            totalSeats: fetchedData.totalSeats,
            hasCharging: fetchedData.hasCharging,
            isQuiet: fetchedData.isQuiet,
          },
          totalSeats: fetchedData.totalSeats,
          availableSeats: fetchedData.availableSeats, // Use calculated available count
          hasCharging: fetchedData.hasCharging,
          isQuiet: fetchedData.isQuiet,
          seats: localSeats, // Set the final seats array
          isLoading: false,
          errorMessage: '',
          // Set user reservation details specific to THIS room
          hasReservation: !!currentUserReservation, // Global check: Does user have *any* reservation?
          userSeatIndex: hasReservationInThisRoom ? userSeatIndex : null,
          userReservationDate: hasReservationInThisRoom ? userReservationDate : null,
          userReservationStartTime: hasReservationInThisRoom ? userReservationStartTime : null,
          userReservationEndTime: hasReservationInThisRoom ? userReservationEndTime : null,
        });
        console.log("Final data set after load and check:", this.data);

      })
      .catch(error => {
        // 7. Handle fetch error
        console.error('Failed to load room data:', error);
        this.setData({
          isLoading: false,
          errorMessage: `加载自习室 "${roomName}" 信息失败：${error.message}`
        });
        wx.showToast({ title: '数据加载失败', icon: 'none' });
      });
  },

  // --- 点击座位事件 ---
  onSeatClick: function(e) {
    if (this.data.isLoading) return; // Don't process clicks while loading

    const seatIndex = e.currentTarget.dataset.index;
    const seat = this.data.seats[seatIndex];
    const currentUserReservation = wx.getStorageSync('userReservation'); // Check global reservation status again

    if (!seat) {
      console.error("Clicked on invalid seat index:", seatIndex);
      return;
    }

    if (seat.status === 'available') {
      // --- Situation 1: Seat is available ---
      if (currentUserReservation) {
        // If user already has a reservation anywhere, prevent booking another
        wx.showToast({
          title: `您已在 ${currentUserReservation.roomName} 预约了座位 ${currentUserReservation.seatIndex + 1} (${currentUserReservation.date} ${currentUserReservation.startTime}-${currentUserReservation.endTime})`,
          icon: 'none',
          duration: 3500, // Longer duration
        });
      } else {
        // No current reservation, open the reservation details modal
        this.setData({
          showReservationModal: true,
          selectedSeatIndex: seatIndex,
          // Reset time selections to defaults when opening modal
          selectedDate: currentDate,
          startTime: '09:00',
          endTime: '10:00',
        });
      }
    } else if (seat.status === 'userReserved') {
      // --- Situation 2: Clicked on own reserved seat in THIS room ---
       if (this.data.userSeatIndex === seatIndex) { // Double check it's the correct user seat
            this.setData({
                showCancelModal: true,
                cancelModalMessage: `取消预约座位 ${seatIndex + 1} (${this.data.userReservationDate} ${this.data.userReservationStartTime}-${this.data.userReservationEndTime}) 吗?`,
                seatIndexToCancel: seatIndex
            });
       } else {
            // Should not happen if logic is correct, but safety check
            console.warn("Clicked userReserved seat, but index doesn't match stored userSeatIndex.");
             wx.showToast({ title: `您已预约此座位`, icon: 'none' });
       }

    } else if (seat.status === 'reserved') {
        // --- Situation 3: Clicked on a seat reserved by someone else ---
         wx.showToast({
          title: `座位 ${seatIndex + 1} 已被他人预约`,
          icon: 'none',
          duration: 2000,
        });
    }
  },

  // --- Reservation Selection Modal Handlers ---
  bindDateChange: function(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  bindStartTimeChange: function(e) {
    this.setData({
      startTime: e.detail.value
    });
  },

  bindEndTimeChange: function(e) {
    this.setData({
      endTime: e.detail.value
    });
  },

  // Close the reservation selection modal without confirming
  cancelReservationSelection: function() {
    this.setData({
      showReservationModal: false,
      selectedSeatIndex: null, // Clear the selected seat index
    });
  },

  // Confirm the reservation from the selection modal
  confirmReservation: function() {
    const { selectedSeatIndex, selectedDate, startTime, endTime, seats, roomName } = this.data;

    // Basic Validation
    if (selectedSeatIndex === null || !selectedDate || !startTime || !endTime) {
        wx.showToast({ title: '请选择完整的预约信息', icon: 'none' });
        return;
    }
    if (startTime >= endTime) {
        wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
        return;
    }
    // --- Add more validation if needed (e.g., check against backend again) ---

    // --- Assume validation passed ---
    const newSeats = [...seats];
    if (!newSeats[selectedSeatIndex] || newSeats[selectedSeatIndex].status !== 'available') {
         wx.showToast({ title: '该座位已被预约或无效', icon: 'none' });
         this.setData({ showReservationModal: false, selectedSeatIndex: null });
         // Optionally re-fetch data
         // this.loadRoomData(this.data.roomName);
         return;
    }

    newSeats[selectedSeatIndex].status = 'userReserved';

    // --- Prepare details for current reservation and history ---
    const reservationDetails = {
        seatIndex: selectedSeatIndex,
        date: selectedDate,
        startTime: startTime,
        endTime: endTime,
        roomName: roomName, // Store room name
        bookingTimestamp: new Date().toISOString(), // Add booking timestamp
        // Add other relevant details if needed, e.g., user ID
        isSignedIn: false, // Default status for new reservations
        isTemporarilyAway: false, // Default status
    };

    // --- 1. Store the CURRENT reservation details ---
    wx.setStorageSync('userReservation', reservationDetails);

    // --- 2. Add to Reservation History ---
    try {
        let history = wx.getStorageSync('reservationHistory') || [];
        if (!Array.isArray(history)) {
            console.warn("Reservation history in storage was not an array. Resetting.");
            history = [];
        }
        history.push(reservationDetails);
        wx.setStorageSync('reservationHistory', history);
        console.log('Reservation added to history:', reservationDetails);
        console.log('Updated History Length:', history.length);

    } catch (e) {
        console.error("Failed to update reservation history:", e);
    }
    // --- End of History Update ---


    // Update page data
    this.setData({
      seats: newSeats,
      hasReservation: true, // Now user has a reservation globally
      userSeatIndex: selectedSeatIndex, // Reservation is in this room
      userReservationDate: selectedDate,
      userReservationStartTime: startTime,
      userReservationEndTime: endTime,
      showReservationModal: false, // Close the selection modal
      selectedSeatIndex: null,    // Clear temporary selection index
      // Update availableSeats based on calculation (or leave as is if API handles it)
      availableSeats: newSeats.filter(s => s.status === 'available').length,
    });

    wx.showToast({
        title: `座位 ${selectedSeatIndex + 1} 预约成功`,
        icon: 'success',
        duration: 2000
    });
  },

  // --- Cancellation Confirmation Modal Handlers ---

  // Close the cancellation confirmation modal
  closeCancelModal: function() {
      this.setData({
          showCancelModal: false,
          cancelModalMessage: '',
          seatIndexToCancel: null,
      });
  },

  // Confirm the cancellation
  confirmCancellation: function() {
      const { seatIndexToCancel, seats } = this.data;
       if (seatIndexToCancel === null) return; // Should not happen

      const newSeats = [...seats];

      // Only allow cancellation if it's the user's reserved seat
      if (newSeats[seatIndexToCancel] && newSeats[seatIndexToCancel].status === 'userReserved') {
        newSeats[seatIndexToCancel].status = 'available';

        // Remove the current reservation from local storage
        wx.removeStorageSync('userReservation');
        console.log("User reservation removed from storage.");

        // --- Optional: Add cancellation event to history or update existing record? ---
        // This depends on requirements. Usually, history shows completed/past reservations.
        // Cancelling might just mean removing the *active* reservation.

        // Update page data
        this.setData({
            seats: newSeats,
            hasReservation: false, // User no longer has an active reservation
            userSeatIndex: null,
            userReservationDate: null,
            userReservationStartTime: null,
            userReservationEndTime: null,
            showCancelModal: false, // Close the cancellation modal
            cancelModalMessage: '',
            seatIndexToCancel: null,
            // Update available seats count
            availableSeats: newSeats.filter(s => s.status === 'available').length,
        });

         wx.showToast({
            title: '预约已取消',
            icon: 'success',
            duration: 2000
        });

      } else {
          console.error("Attempting to cancel a seat that is not 'userReserved' or doesn't exist.");
          wx.showToast({ title: '取消失败，状态异常', icon: 'none'});
          this.closeCancelModal(); // Close modal anyway
      }
  },

  // Cancel the cancellation action (just close modal)
  cancelCancellationAction: function() {
    this.closeCancelModal();
  },

});
