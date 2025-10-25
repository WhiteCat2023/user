
import { db } from '@/api/config/firebase.config';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const emergencyTypes = [
  'Medical',
  'Fire',
  'Crime',
  'Other',
];

const SOS = () => {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const countdownRef = useRef(null);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyCountdown, setVerifyCountdown] = useState(60);
  const verifyRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [lastSentLocation, setLastSentLocation] = useState(null);
  const [lastSosUnverified, setLastSosUnverified] = useState(false);
  const [cancelCount, setCancelCount] = useState(0);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [warningShowCount, setWarningShowCount] = useState(0);
  const [suspendedUntil, setSuspendedUntil] = useState(null); // ms epoch
  const [suspendedModalVisible, setSuspendedModalVisible] = useState(false);

  const { user, userDoc } = useAuth();
  const router = useRouter();
  const hasContact = Boolean(userDoc?.phoneNumber || userDoc?.phone);

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [otherReason, setOtherReason] = useState('');
  const [showReassureModal, setShowReassureModal] = useState(false);
  const [reassureTitle, setReassureTitle] = useState('');
  const [reassureBody, setReassureBody] = useState('');

  useEffect(() => {
    if (confirmVisible) {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            // countdown finished — hide countdown and show the Confirm SOS modal
            setConfirmVisible(false);
            setShowConfirmModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [confirmVisible]);

  // load persisted cancel count for this user
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const key = user?.uid ? `sos_cancel_count_${user.uid}` : null;
        if (!key) return;
        const val = await AsyncStorage.getItem(key);
        if (mounted && val) setCancelCount(parseInt(val, 10) || 0);
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [user, userDoc]);

  // load persisted suspension state
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const key = user?.uid ? `sos_suspended_until_${user.uid}` : `sos_suspended_until_local`;
        const val = await AsyncStorage.getItem(key);
        if (mounted && val) {
          const ms = parseInt(val, 10);
          if (!Number.isNaN(ms)) setSuspendedUntil(ms);
        } else if (mounted && userDoc?.sosSuspendedUntilMs) {
          // fallback to server-side value if client hasn't persisted it locally
          const serverMs = userDoc.sosSuspendedUntilMs;
          if (typeof serverMs === 'number' && !Number.isNaN(serverMs)) setSuspendedUntil(serverMs);
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const clearSuspension = async () => {
    try {
      setSuspendedUntil(null);
      const keyUntil = user?.uid ? `sos_suspended_until_${user.uid}` : `sos_suspended_until_local`;
      await AsyncStorage.removeItem(keyUntil);
      // Also try to clear suspension metadata in Firestore (best-effort).
      if (user?.uid) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            sosSuspended: false,
            sosSuspendedAt: null,
            sosSuspendedUntilMs: null,
          });
        } catch (e) {
          console.warn('Could not clear suspension in Firestore (client may lack permission)', e);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const CANCEL_THRESHOLD = 5; // cancels before 1-week suspension

  const suspendUserForWeek = async (reason) => {
    try {
      const until = Date.now() + 7 * 24 * 60 * 60 * 1000; // 1 week in ms
      setSuspendedUntil(until);
      setSuspendedModalVisible(true);

      // persist locally
      const keyUntil = user?.uid ? `sos_suspended_until_${user.uid}` : `sos_suspended_until_local`;
      await AsyncStorage.setItem(keyUntil, String(until));

      // clear cancel count
      setCancelCount(0);
      const keyCount = user?.uid ? `sos_cancel_count_${user.uid}` : `sos_cancel_count_local`;
      await AsyncStorage.removeItem(keyCount);

      // Try to persist suspension metadata to Firestore user document so admins
      // or backend tooling can see when the suspension started and when it ends.
      // This is best-effort: if security rules prevent the update the app will
      // continue to enforce suspension locally and log a warning.
      if (user?.uid) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            sosSuspended: true,
            sosSuspendedAt: serverTimestamp(),
            sosSuspendedUntilMs: until,
          });
        } catch (e) {
          // do not block the UX if Firestore update fails (likely due to rules)
          console.warn('Could not persist suspension to Firestore (client may lack permission)', e);
        }
      }
      // NOTE: we intentionally do NOT modify auth state or perform privileged
      // updates to the user's auth token here. Persisting suspension is done
      // locally (AsyncStorage) so the user remains signed in. If you want a
      // server-side record, implement an admin-only endpoint or cloud
      // function that sets the user's document — do not call it from the
      // client with elevated privileges.
    } catch (e) {
      console.warn('suspendUserForWeek failed', e);
    }
  };

  const incrementCancelCount = async (reason) => {
    try {
      const key = user?.uid ? `sos_cancel_count_${user.uid}` : `sos_cancel_count_local`;
      const next = (cancelCount || 0) + 1;
      setCancelCount(next);
      await AsyncStorage.setItem(key, String(next));

      // If next is 3 or 4 (approaching suspension), show a clear warning that further cancels will suspend for 1 week
      if (next >= 3 && next < CANCEL_THRESHOLD) {
        setWarningShowCount(next);
        setWarningModalVisible(true);
      }

      // If next reaches threshold, suspend user
      if (next >= CANCEL_THRESHOLD) {
        await suspendUserForWeek(reason);
      }
    } catch (e) {
      console.warn('incrementCancelCount failed', e);
    }
  };

  const triggerLocationAndType = async (retry = false) => {
    setConfirmVisible(false);
    setLoadingLocation(true);
    try {
      // Ensure device location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLoadingLocation(false);
        Alert.alert(
          'Location services disabled',
          'Please enable location services on your device to send an accurate SOS.',
          [
            { text: 'Retry', onPress: () => triggerLocationAndType(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingLocation(false);
        Alert.alert(
          'Location permission',
          'Permission to access location was denied. Please enable it in settings to send accurate SOS data.',
          [
            { text: 'Retry', onPress: () => triggerLocationAndType(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Try to get the current position (balanced accuracy for speed), fallback to last known
      let loc = null;
      try {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, maximumAge: 10000 });
      } catch (e) {
        console.warn('Primary location fetch failed:', e);
      }

      if (!loc) {
        try {
          loc = await Location.getLastKnownPositionAsync();
        } catch (e) {
          console.warn('Last known position fetch failed:', e);
        }
      }

      if (!loc) {
        setLoadingLocation(false);
        Alert.alert(
          'Location unavailable',
          'Unable to determine current location. Please retry with location turned on to send SOS.',
          [
            { text: 'Retry', onPress: () => triggerLocationAndType(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      setLocation(loc.coords);
      setLoadingLocation(false);
      setTypeModalVisible(true);
    } catch (e) {
      setLoadingLocation(false);
      console.error('Location error:', e);
      Alert.alert('Location error', 'Could not fetch location. Try again.', [
        { text: 'Retry', onPress: () => triggerLocationAndType(true) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handlePress = () => {
    // Require contact number
    // Check suspension
    try {
      if (suspendedUntil && Date.now() < suspendedUntil) {
        const until = new Date(suspendedUntil).toLocaleString();
        Alert.alert('SOS access restricted', `Your SOS access is suspended until ${until}.`);
        return;
      }
      // if suspension expired, clear it
      if (suspendedUntil && Date.now() >= suspendedUntil) {
        clearSuspension();
      }
    } catch (e) {
      // ignore
    }

    if (!hasContact) {
      Alert.alert(
        'Contact number required',
        'Please add a contact number to your profile before sending an SOS. This helps responders identify you.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update profile', onPress: () => router.push('/(tabs)/(profile)/profile') },
        ],
      );
      return;
    }

    // Start the 3s countdown first; after it finishes we'll show the confirm modal
    setConfirmVisible(true);
  };

  const handleCancelConfirm = () => {
    clearInterval(countdownRef.current);
    setConfirmVisible(false);
    setCountdown(3);
    incrementCancelCount('Cancelled during 3s countdown');
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setTypeModalVisible(false);
    // send to firestore with duplicate detection
    sendSosToFirestore(type);
  };

  // Persist the 'Other' text as the user types so it's not lost if modal closes
  useEffect(() => {
    const key = user?.uid ? `sos_other_draft_${user.uid}` : null;
    let mounted = true;
    if (!key) return;

    // load existing draft when modal opens
    const loadDraft = async () => {
      try {
        const val = await AsyncStorage.getItem(key);
        if (mounted && val) setOtherReason(val);
      } catch (e) {
        // ignore
      }
    };

    if (typeModalVisible && selectedType === 'Other') loadDraft();

    return () => { mounted = false; };
  }, [typeModalVisible, selectedType, user]);

  useEffect(() => {
    const key = user?.uid ? `sos_other_draft_${user.uid}` : null;
    if (!key) return;
    const save = async () => {
      try {
        if (otherReason && otherReason.length > 0) {
          await AsyncStorage.setItem(key, otherReason);
        } else {
          await AsyncStorage.removeItem(key);
        }
      } catch (e) {
        // ignore
      }
    };
    save();
  }, [otherReason, user]);

  const sendSosToFirestore = async (type) => {
    if (!location) {
      Alert.alert('Location required', 'GPS coordinates are required to send an SOS. Please enable location and try again.');
      return;
    }

    try {
      // duplicate detection: reports within 5 minutes within ~50 meter radius
      const timeWindowMs = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();

  const snapshot = await getDocs(collection(db, 'sos'));
      let possibleDuplicate = false;

      const metersBetween = (lat1, lon1, lat2, lon2) => {
        const R = 6371000; // meters
        const toRad = (v) => (v * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (!data || !data.timestamp || !data.location) return;
        const ts = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : (data.timestamp || 0);
        if (now - ts > timeWindowMs) return; // older than window
        // support both { latitude, longitude } and [lat, long]
        let docLat = null, docLon = null;
        if (Array.isArray(data.location)) {
          docLat = data.location[0];
          docLon = data.location[1];
        } else if (data.location.latitude !== undefined) {
          docLat = data.location.latitude;
          docLon = data.location.longitude;
        }
        if (docLat == null || docLon == null) return;
        const dist = metersBetween(location.latitude, location.longitude, docLat, docLon);
        if (dist <= 50 && data.type === type) {
          possibleDuplicate = true;
        }
      });

      await addDoc(collection(db, 'sos'), {
        uid: user?.uid || null,
        firstName: userDoc?.firstName || null,
        lastName: userDoc?.lastName || null,
        contactNumber: userDoc?.phoneNumber || userDoc?.phone || null,
        type: type,
        typeDetail: type === 'Other' ? (otherReason || null) : null,
        location: [location.latitude, location.longitude],
        timestamp: serverTimestamp(),
        status: possibleDuplicate ? 'possible duplicate' : 'pending',
        read: false,
      });

      // Show professional reassuring modal instead of an alert
      if (possibleDuplicate) {
        setReassureTitle('SOS Received — Under Review');
        setReassureBody(
          'We received your emergency request and responders have been notified. Your report appears similar to a recent submission and will be reviewed by responders to avoid duplicate dispatches. If this is still an active emergency, please remain where you are and await assistance — help is on the way.'
        );
      } else {
        setReassureTitle('SOS Confirmed');
        setReassureBody(
          'Your emergency request has been received and Barangay responders have been notified. Please stay safe, follow any instructions from emergency personnel, and remain at the location you reported. Responders are en route and will assist you shortly.'
        );
      }
  setLastSosUnverified(false);
  setShowReassureModal(true);
      // Successful verified/pending SOS — reset any accumulated cancel count so the user isn't penalized
      try {
        setCancelCount(0);
        setWarningShowCount(0);
        const keyCount = user?.uid ? `sos_cancel_count_${user.uid}` : `sos_cancel_count_local`;
        await AsyncStorage.removeItem(keyCount);
      } catch (err) {
        // non-critical
        console.warn('Could not reset cancel count after successful SOS', err);
      }
      // preserve last sent location for the reassurance modal map/fallback
      try {
        if (location && location.latitude != null && location.longitude != null) {
          setLastSentLocation([location.latitude, location.longitude]);
        }
      } catch (err) {
        console.warn('Could not set lastSentLocation', err);
      }
      // reset selection/state
      setSelectedType(null);
      // clear any saved 'Other' draft and local state
      try {
        if (user?.uid) await AsyncStorage.removeItem(`sos_other_draft_${user.uid}`);
      } catch (e) {
        // ignore
      }
      setOtherReason('');
      setLocation(null);
    } catch (e) {
      console.error('Error sending SOS:', e);
      Alert.alert('Send error', 'Could not send SOS. Please try again.');
    }
  };

  // Send an unverified SOS when user cancels or fails to confirm within 60s
  const sendUnverifiedSos = async () => {
    // best-effort location
    let locCoords = null;
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (servicesEnabled) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const l = await Location.getLastKnownPositionAsync();
            if (l && l.coords) locCoords = [l.coords.latitude, l.coords.longitude];
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      // ignore location errors for unverified submission
      console.warn('Unverified SOS location fetch failed', e);
    }

    try {
      await addDoc(collection(db, 'sos'), {
        uid: user?.uid || null,
        firstName: userDoc?.firstName || null,
        lastName: userDoc?.lastName || null,
        contactNumber: userDoc?.phoneNumber || userDoc?.phone || null,
        type: null,
        typeDetail: null,
        location: locCoords,
        timestamp: serverTimestamp(),
        status: 'unverified',
        verified: false,
        read: false,
      });

      setLastSosUnverified(true);
      setReassureTitle('SOS Not Confirmed');
      setReassureBody(
        'You did not confirm the emergency within the time limit. An unverified alert was recorded for review. If you still require urgent assistance, please try again and follow the prompts.'
      );
      setShowReassureModal(true);
      if (locCoords && locCoords.length === 2) setLastSentLocation(locCoords);
    } catch (e) {
      console.error('Error sending unverified SOS:', e);
      Alert.alert('Send error', 'Could not record unverified SOS. Please try again.');
    }
  };

  // cleanup verify timer when component unmounts
  useEffect(() => {
    return () => {
      try { clearInterval(verifyRef.current); } catch (e) {}
      try { clearInterval(countdownRef.current); } catch (e) {}
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessible
        accessibilityLabel="Send SOS"
        accessibilityHint="Sends an alert to emergency contacts"
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          styles.outerRing,
          (!hasContact || (suspendedUntil && Date.now() < suspendedUntil)) ? styles.outerRingDisabled : null,
        ]}
      >
        <View style={styles.innerCircle}>
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </TouchableOpacity>

      {/* Show in-app suspension banner when suspended */}
      {suspendedUntil && Date.now() < suspendedUntil && (
        <View style={{ marginTop: 16, paddingHorizontal: 20 }}>
          <Text style={{ color: '#b91c1c', textAlign: 'center', fontWeight: '700' }}>
            Your account’s SOS access is temporarily suspended until {new Date(suspendedUntil).toLocaleString()}.
          </Text>
        </View>
      )}

      {/* Confirmation modal with 3s countdown */}
      <Modal transparent visible={confirmVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Are you sure?</Text>
            <Text style={styles.confirmText}>Sending emergency alert in {countdown} second{countdown !== 1 ? 's' : ''}.</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelConfirm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reassurance modal shown after sending SOS (dismiss with top-right X) */}
      <Modal transparent visible={showReassureModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.reassureBox}>
            {/* Top-right close X */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReassureModal(false)}
              accessibilityLabel="Close reassurance dialog"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.reassureTitle}>{reassureTitle}</Text>
            <View style={styles.divider} />
            <Image source={require('@/assets/images/green-confirm.png')} style={styles.reassureIcon} resizeMode="contain" />
            <Text style={styles.reassureBody}>{reassureBody}</Text>
            {/* Location fallback: only show Open in Maps button */}
            <View style={{ marginTop: 16, width: '100%' }}>
              {lastSosUnverified ? (
                <View style={styles.noFilesContainer}>
                  <Text style={{ color: '#6b7280', textAlign: 'center' }}>Location not shown for unverified alerts.</Text>
                </View>
              ) : (lastSentLocation && lastSentLocation.length === 2 ? (
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => {
                      const lat = lastSentLocation[0];
                      const lng = lastSentLocation[1];
                      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                      Linking.openURL(url);
                    }}
                    style={{ width: '80%', backgroundColor: '#16a34a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 16 }}>Click to view location</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noFilesContainer}>
                  <Text style={{ color: '#6b7280' }}>Location not available.</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Confirm SOS modal (design from provided image) */}
      <Modal transparent visible={showConfirmModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            <Text style={styles.confirmModalTitle}>CONFIRM SOS</Text>
            <View style={styles.divider} />

            <Image
              source={require('@/assets/images/confirm-sos.png')}
              style={styles.confirmIcon}
              resizeMode="contain"
            />

            <Text style={styles.messageText}>
              This will alert Barangay Responders immediately. Use only for real emergencies.
            </Text>

            <View style={styles.footerButtonRow}>
              <TouchableOpacity
                style={styles.leftButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  incrementCancelCount('Cancelled on confirm modal');
                }}
              >
                <Text style={styles.leftButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rightButton}
                onPress={() => {
                  setShowConfirmModal(false);
                  // user confirmed — show the verify modal that requires typing YES
                  setVerifyInput('');
                  setVerifyCountdown(60);
                  setVerifyModalVisible(true);
                  // start 60s countdown
                  verifyRef.current = setInterval(() => {
                    setVerifyCountdown((prev) => {
                      if (prev <= 1) {
                        clearInterval(verifyRef.current);
                        // timed out — mark as unverified
                        setVerifyModalVisible(false);
                        sendUnverifiedSos();
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }}
              >
                <Text style={styles.rightButtonText}>Confirm SOS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verify modal: type YES to confirm within 60s */}
      <Modal transparent visible={verifyModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.verifyBox}>
            {/* Close X */}
            <TouchableOpacity
              style={styles.verifyClose}
              onPress={() => {
                clearInterval(verifyRef.current);
                setVerifyModalVisible(false);
                incrementCancelCount('Cancelled on verify close');
                sendUnverifiedSos();
              }}
              accessibilityLabel="Close verification dialog"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Image source={require('@/assets/images/confirm-sos.png')} style={styles.verifyIcon} resizeMode="contain" />

            <Text style={styles.verifyTitle}>Confirm emergency</Text>
            <Text style={styles.verifyText}>
              Type <Text style={{ fontWeight: '800' }}>YES</Text> below to confirm this emergency. This will send an alert to Barangay San Nicholas.
            </Text>

            <View style={styles.verifyMetaRow}>
              <Text style={styles.verifyCountdown}>Time remaining: </Text>
              <Text style={[styles.verifyCountdown, { fontWeight: '900', color: '#dc2626' }]}>{verifyCountdown}s</Text>
            </View>

            <TextInput
              value={verifyInput}
              onChangeText={setVerifyInput}
              placeholder="YES"
              placeholderTextColor="#9ca3af"
              style={styles.verifyInput}
              autoCapitalize="characters"
              accessibilityLabel="Confirm emergency input"
              returnKeyType="done"
            />

            <View style={styles.verifyButtonsRow}>
              <TouchableOpacity
                style={[styles.verifyActionButton, styles.verifyCancelButton]}
                onPress={() => {
                  // user cancelled the verify modal -> mark unverified
                  clearInterval(verifyRef.current);
                  setVerifyModalVisible(false);
                  incrementCancelCount('Cancelled on verify cancel');
                  sendUnverifiedSos();
                }}
              >
                <Text style={[styles.verifyActionText, styles.verifyCancelText]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verifyActionButton, styles.verifySubmitButton]}
                onPress={() => {
                  if ((verifyInput || '').trim().toUpperCase() === 'YES') {
                    clearInterval(verifyRef.current);
                    setVerifyModalVisible(false);
                    setVerifyInput('');
                    // proceed to fetch location and choose type
                    triggerLocationAndType();
                  } else {
                    Alert.alert('Confirmation required', 'Type YES exactly to confirm this emergency.');
                  }
                }}
              >
                <Text style={[styles.verifyActionText, styles.verifySubmitText]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Warning modal shown after repeated cancellations */}
      <Modal transparent visible={warningModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.warningBox}>
            <Image source={require('@/assets/images/confirm-sos.png')} style={styles.warningIcon} resizeMode="contain" />
            <Text style={styles.warningTitle}>Warning: Potential Misuse Detected</Text>

            <Text style={styles.warningBody}>
              We detected <Text style={styles.warningCountText}>{warningShowCount}</Text> out of <Text style={styles.warningCountText}>{CANCEL_THRESHOLD}</Text> repeated cancellations of the SOS flow. Please only use SOS for real emergencies.
            </Text>

            <Text style={[styles.warningBody, { marginBottom: 6, fontSize: 13 }]}>If you cancel {CANCEL_THRESHOLD} times, SOS access will be suspended for 1 week.</Text>

            <View style={styles.warningButtonsRow}>
              <TouchableOpacity
                style={[styles.warningButton, styles.warningSingleButton]}
                onPress={() => {
                  setWarningModalVisible(false);
                }}
                accessibilityLabel="Acknowledge misuse warning"
              >
                <Text style={styles.warningSingleText}>I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suspended modal shown when user is suspended */}
      <Modal transparent visible={suspendedModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.suspendedBox}>
            <Image source={require('@/assets/images/confirm-sos.png')} style={styles.warningIcon} resizeMode="contain" />
            <Text style={styles.suspendedTitle}>SOS Temporarily Suspended</Text>
            <Text style={styles.suspendedBody}>
              Your SOS access has been suspended for 1 week due to repeated cancellations. You will regain access automatically after the suspension period. If you believe this is a mistake, contact support.
            </Text>

            <TouchableOpacity
              style={styles.suspendedButton}
              onPress={() => setSuspendedModalVisible(false)}
              accessibilityLabel="Dismiss suspension dialog"
            >
              <Text style={styles.suspendedButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading location */}
      <Modal transparent visible={loadingLocation} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <ActivityIndicator size="large" color="#ef4444" />
            <Text style={[styles.confirmText, { marginTop: 12 }]}>Fetching location...</Text>
          </View>
        </View>
      </Modal>

      {/* Emergency type selector modal (select then confirm) */}
      <Modal transparent visible={typeModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.typeBox}>
            <Text style={styles.confirmTitle}>Select Emergency Type</Text>
            {emergencyTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeItem,
                  selectedType === t ? styles.typeItemSelected : null,
                ]}
                onPress={() => setSelectedType(t)}
              >
                <Text style={[styles.typeText, selectedType === t ? styles.typeTextSelected : null]}>{t}</Text>
              </TouchableOpacity>
            ))}

            {selectedType === 'Other' && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.inputLabel}>Please describe the emergency</Text>
                <Text style={styles.inputHint}>Provide a brief, clear description so responders know what to expect.</Text>
                <TextInput
                  value={otherReason}
                  onChangeText={(text) => setOtherReason(text)}
                  placeholder="e.g. gas smell in building, child missing near market, strong chemical odor"
                  placeholderTextColor="#9ca3af"
                  style={styles.otherInput}
                  returnKeyType="done"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={300}
                  accessibilityLabel="Other emergency description"
                />
                <View style={styles.counterRow}>
                  <Text style={styles.counterText}>{otherReason ? otherReason.length : 0}/300</Text>
                </View>
              </View>
            )}

            <View style={styles.footerButtons}>
              {(() => {
                const canConfirm = Boolean(selectedType) && (selectedType !== 'Other' || (otherReason && otherReason.trim().length > 0));
                return (
                  <TouchableOpacity
                    style={[styles.confirmButton, !canConfirm ? styles.confirmButtonDisabled : null]}
                    disabled={!canConfirm}
                    onPress={() => canConfirm && handleSelectType(selectedType)}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                );
              })()}

              <TouchableOpacity style={styles.cancelButton} onPress={() => { setTypeModalVisible(false); setSelectedType(null); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  outerRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#f1f5f9', // light gray ring
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ef4444', // red
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sosText: {
    color: '#000',
    fontSize: 28,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmModalBox: {
    width: 340,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#e6e6e6',
    width: '90%',
    marginVertical: 12,
  },
  confirmIcon: {
    width: 110,
    height: 110,
    marginVertical: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 18,
  },
  reassureBox: {
    width: 340,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  reassureTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  reassureIcon: {
    width: 96,
    height: 96,
    marginVertical: 10,
  },
  reassureBody: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '700',
  },
  footerButtonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  leftButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#ff5c63',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rightButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leftButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  rightButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  cancelText: {
    color: '#111827',
    fontWeight: '600',
  },
  typeBox: {
    width: 320,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  typeItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 6,
    backgroundColor: '#f8fafc',
  },
  typeItemSelected: {
    backgroundColor: '#e6ffed',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  typeText: {
    fontSize: 16,
    color: '#0f172a',
  },
  typeTextSelected: {
    color: '#065f46',
    fontWeight: '700',
  },
  outerRingDisabled: {
    opacity: 0.5,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  confirmButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#fca5a5',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 6,
  },
  otherInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#0f172a',
    width: 280,
    minHeight: 96,
    fontSize: 14,
    lineHeight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  counterRow: {
    marginTop: 6,
    width: 280,
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 12,
    color: '#6b7280',
  },
  verifyBox: {
    width: 340,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  verifyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 6,
    color: '#111827',
  },
  verifyText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
  },
  verifyCountdown: {
    marginTop: 8,
    color: '#6b7280',
    fontWeight: '700',
  },
  verifyInput: {
    marginTop: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 16,
    textAlign: 'center',
  },
  verifyIcon: {
    width: 86,
    height: 86,
    marginBottom: 6,
  },
  verifyClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  },
  verifyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  verifyButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  verifyActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyActionText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyCancelButton: {
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  verifySubmitButton: {
    backgroundColor: '#16a34a',
    marginLeft: 8,
  },
  verifyCancelText: {
    color: '#111827',
  },
  verifySubmitText: {
    color: '#fff',
  },
  warningBox: {
    width: 340,
    paddingVertical: 20,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  warningIcon: {
    width: 80,
    height: 80,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
    textAlign: 'center',
  },
  warningBody: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  warningButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginTop: 6,
  },
  warningButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningSecondary: {
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  warningPrimary: {
    backgroundColor: '#dc2626',
    marginLeft: 8,
  },
  warningPrimaryText: {
    color: '#fff',
    fontWeight: '800',
  },
  warningSecondaryText: {
    color: '#111827',
    fontWeight: '700',
  },
  warningSingleButton: {
    width: '62%',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningSingleText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
 
  warningCountText: {
    color: '#b91c1c',
    fontWeight: '900',
    fontSize: 14,
  },
  /* Suspended modal specific styles */
  suspendedBox: {
    width: 340,
    paddingVertical: 22,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 16,
  },
  suspendedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 6,
    marginBottom: 8,
    textAlign: 'center',
  },
  suspendedBody: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  suspendedButton: {
    width: '60%',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendedButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});

// mapStyles removed — only Open in Maps button is used now

export default SOS;