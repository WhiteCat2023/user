import { db } from '../api/config/firebase.config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

class ReportNotificationService {
  constructor() {
    this.unsubscribe = null;
  }

  listenToReportUpdates(userId, onUpdate) {
    const reportsRef = collection(db, 'reports');
    const userReportsQuery = query(
      reportsRef,
      where('uid', '==', userId)
    );

    this.unsubscribe = onSnapshot(userReportsQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const reportData = change.doc.data();
        
        if (change.type === 'modified') {
          // Check if status changed to responded or ignored
          if (reportData.status === 'responded' || reportData.status === 'ignored') {
            // Schedule local notification
            await this.showStatusNotification(reportData);
            // Trigger update callback
            onUpdate();
          }
        }
      });
    });
  }

  async showStatusNotification(report) {
    const statusText = report.status === 'responded' ? 'Responded to' : 'Declined';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Report ${statusText}`,
        body: `Your report "${report.title}" has been ${report.status}`,
        data: { reportId: report.id },
        sound: 'default',
        badge: 1,
      },
      trigger: null, // Show immediately
    });
  }

  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export default new ReportNotificationService();
