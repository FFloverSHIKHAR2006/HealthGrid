import Prescription from '../models/Prescription.js';
import Reminder from '../models/Reminder.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { HttpError } from '../utils/asyncHandler.js';

/**
 * Determine default time slots and reminder configuration from clinical prescription instructions
 */
export const parsePrescriptionSchedule = (prescription) => {
  const freqStr = `${prescription.frequency || ''} ${prescription.dosage || ''} ${prescription.instructions || ''}`.toLowerCase();

  let times = ['08:00'];
  let frequencyType = 'daily';

  if (freqStr.includes('bid') || freqStr.includes('twice') || freqStr.includes('2 times') || freqStr.includes('2x')) {
    times = ['08:00', '20:00'];
    frequencyType = 'twice_daily';
  } else if (freqStr.includes('tid') || freqStr.includes('three') || freqStr.includes('3 times') || freqStr.includes('3x')) {
    times = ['08:00', '14:00', '20:00'];
    frequencyType = 'three_times_daily';
  } else if (freqStr.includes('qid') || freqStr.includes('four') || freqStr.includes('4 times')) {
    times = ['08:00', '12:00', '16:00', '20:00'];
    frequencyType = 'four_times_daily';
  } else if (freqStr.includes('hs') || freqStr.includes('bedtime') || freqStr.includes('night') || freqStr.includes('evening')) {
    times = ['21:00'];
    frequencyType = 'nightly';
  } else if (freqStr.includes('weekly')) {
    times = ['09:00'];
    frequencyType = 'weekly';
  } else if (freqStr.includes('prn') || freqStr.includes('as needed')) {
    times = ['08:00'];
    frequencyType = 'as_needed';
  }

  return { times, frequencyType };
};

/**
 * Automatically schedule reminders from an existing prescription
 */
export const scheduleRemindersForPrescription = async (prescriptionId, createdByUserId = null) => {
  const prescription = await Prescription.findById(prescriptionId).populate('patient');
  if (!prescription) {
    throw new HttpError(404, 'Prescription not found');
  }

  const { times, frequencyType } = parsePrescriptionSchedule(prescription);
  const createdReminders = [];

  // Check if reminders already exist for this prescription to avoid exact duplicates
  const existingReminders = await Reminder.find({
    prescription: prescription._id,
    status: 'active',
  });

  if (existingReminders.length > 0) {
    return {
      message: 'Prescription is already scheduled for reminders',
      reminders: existingReminders,
    };
  }

  // Generate reminder for each dosage time window
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    const timeLabel = times.length > 1 ? ` (Dose ${i + 1}/${times.length} at ${time})` : '';

    const reminder = await Reminder.create({
      patient: prescription.patient._id,
      createdBy: createdByUserId || prescription.provider,
      type: 'medication',
      title: `${prescription.medication}${timeLabel}`,
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: frequencyType,
      time,
      times,
      prescription: prescription._id,
      instructions: prescription.instructions || 'Take as clinically directed by your physician.',
      status: 'active',
    });

    createdReminders.push(reminder);
  }

  // Find user associated with this patient to dispatch notification
  const patientUser = await User.findOne({ patient: prescription.patient._id });
  if (patientUser) {
    await Notification.create({
      recipient: patientUser._id,
      patient: prescription.patient._id,
      type: 'prescription_alert',
      title: 'Medication Reminders Auto-Scheduled',
      message: `Your doctor has prescribed ${prescription.medication} (${prescription.dosage}). Automated daily reminders set for ${times.join(', ')}.`,
      priority: 'normal',
      reminder: createdReminders[0]?._id,
      metadata: { prescriptionId: prescription._id, times },
    });
  }

  return {
    message: `Scheduled ${createdReminders.length} reminder(s) for ${prescription.medication}`,
    reminders: createdReminders,
  };
};
