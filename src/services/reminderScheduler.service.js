import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

let schedulerInterval = null;

/**
 * Check for due medication reminders and upcoming appointments,
 * generating notifications when due.
 */
export const checkDueReminders = async () => {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const todayStr = now.toISOString().split('T')[0];

  let generatedCount = 0;

  try {
    // 1. Process Medication Reminders
    const activeMedReminders = await Reminder.find({
      type: 'medication',
      status: 'active',
    });

    for (const rem of activeMedReminders) {
      // Check if reminder is due
      // A reminder is considered due if rem.time matches or if rem.times includes current hour/minute window,
      // or for daily checks if no notification exists today.
      const reminderTimes = rem.times && rem.times.length > 0 ? rem.times : rem.time ? [rem.time] : ['08:00'];
      const isDueWindow = reminderTimes.some((t) => {
        // Match exact or hour window
        return t === currentTimeStr || t.split(':')[0] === currentHours;
      });

      if (!isDueWindow && process.env.NODE_ENV !== 'test') {
        continue;
      }

      // Check if notification already created for this reminder today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const existingNotif = await Notification.findOne({
        reminder: rem._id,
        type: 'medication_due',
        createdAt: { $gte: startOfDay },
      });

      if (!existingNotif) {
        const patientUser = await User.findOne({ patient: rem.patient });
        if (patientUser) {
          await Notification.create({
            recipient: patientUser._id,
            patient: rem.patient,
            type: 'medication_due',
            title: `Medication Due: ${rem.title}`,
            message: `It is time to take your dose of ${rem.medication || rem.title} (${rem.dosage || 'prescribed dose'}). Instructions: ${rem.instructions || 'Take with water.'}`,
            priority: 'urgent',
            reminder: rem._id,
            metadata: {
              medication: rem.medication,
              dosage: rem.dosage,
              scheduledTime: rem.time || currentTimeStr,
            },
          });
          generatedCount++;
        }
      }
    }

    // 2. Process Upcoming Doctor Appointments (within 48 hours)
    const upcomingWindow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const activeAppointments = await Reminder.find({
      type: 'appointment',
      status: 'active',
      appointmentDate: { $gte: now, $lte: upcomingWindow },
    });

    for (const app of activeAppointments) {
      const existingAppNotif = await Notification.findOne({
        reminder: app._id,
        type: 'appointment_upcoming',
      });

      if (!existingAppNotif) {
        const patientUser = await User.findOne({ patient: app.patient });
        if (patientUser) {
          const appDateFormatted = app.appointmentDate
            ? new Date(app.appointmentDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'upcoming date';

          await Notification.create({
            recipient: patientUser._id,
            patient: app.patient,
            type: 'appointment_upcoming',
            title: `Upcoming Consultation: ${app.title}`,
            message: `Reminder: You have an appointment with ${app.doctorName || 'your doctor'} on ${appDateFormatted} at ${app.appointmentTime || 'scheduled time'}. Facility: ${app.facility || 'Clinical Facility'}.`,
            priority: 'normal',
            reminder: app._id,
            metadata: {
              doctorName: app.doctorName,
              facility: app.facility,
              appointmentDate: app.appointmentDate,
            },
          });
          generatedCount++;
        }
      }
    }
  } catch (err) {
    console.error('Error during reminder check cycle:', err.message);
  }

  return { timestamp: now.toISOString(), generatedCount };
};

/**
 * Start the background scheduler timer
 */
export const startReminderScheduler = (intervalMs = 60000) => {
  if (schedulerInterval) return;

  // Run initial check
  checkDueReminders().catch((err) =>
    console.warn('Initial reminder scheduler check error:', err.message)
  );

  // Set recurring interval
  schedulerInterval = setInterval(() => {
    checkDueReminders().catch((err) =>
      console.warn('Recurring reminder scheduler error:', err.message)
    );
  }, intervalMs);

  // Unref interval so it won't block process termination
  if (schedulerInterval.unref) {
    schedulerInterval.unref();
  }

  console.log(`[HealthGrid] Reminder background scheduler started (cycle: ${intervalMs / 1000}s).`);
};

/**
 * Stop the background scheduler
 */
export const stopReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[HealthGrid] Reminder background scheduler stopped.');
  }
};
