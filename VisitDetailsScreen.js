// Add this import at the top
import CustomPopup from './CustomPopup';
import { toast } from 'expo-sonner';

// Add these states in the component
const [popupVisible, setPopupVisible] = useState(false);
const [popupTitle, setPopupTitle] = useState('');
const [popupMessage, setPopupMessage] = useState('');
const [popupType, setPopupType] = useState('success');
const [isCheckedIn, setIsCheckedIn] = useState(false);
const [loading, setLoading] = useState(false);

// Update handleCheckIn function
const handleCheckIn = async () => {
    if (loading) return;
    setLoading(true);
    setPopupVisible(true);
    setPopupTitle('Processing...');
    setPopupMessage('Please wait');
    setPopupType('loading');
    
    try {
        if (!isCheckedIn) {
            // CHECK IN
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPopupTitle('Permission Denied');
                setPopupMessage('Location permission is required to check in');
                setPopupType('error');
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            
            const { latitude, longitude } = location.coords;
            const userId = await getCurrentUserId();
            
            if (!userId) {
                throw new Error('Could not get current user ID');
            }
            
            // 1. Create Attendance record
            const attendanceBody = {
                Employee_Name__c: userId,
                Login_Time__c: new Date().toISOString(),
                Latitude__c: latitude.toString(),
                Longitude__c: longitude.toString(),
                Status__c: 'Present'
            };
            
            const attendanceResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Attendence__c`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attendanceBody),
            });
            
            if (!attendanceResponse.ok) {
                const errorData = await attendanceResponse.json();
                throw new Error(errorData[0]?.message || 'Failed to create attendance record');
            }
            
            // 2. Update Actual Start Time on Visit
            const updateResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Visit/${visit.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${sfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    ActualStartTime__c: new Date().toISOString()
                }),
            });
            
            if (!updateResponse.ok) {
                console.log('Warning: Could not update actual start time');
            }
            
            setIsCheckedIn(true);
            visit.actualStartTime = new Date().toISOString();
            
            setPopupTitle('🎉 Checked In!');
            setPopupMessage(`Successfully checked in at ${new Date().toLocaleTimeString()}`);
            setPopupType('success');
            
        } else {
            // CHECK OUT
            setPopupVisible(false);
            setLoading(false);
            
            // Show confirmation for check out
            Alert.alert(
                'Check Out',
                `Ready to check out from ${visit.customer}?`,
                [
                    { text: 'Not Yet', style: 'cancel' },
                    { 
                        text: 'Yes, Check Out', 
                        onPress: async () => {
                            setLoading(true);
                            setPopupVisible(true);
                            setPopupTitle('Processing...');
                            setPopupMessage('Please wait');
                            setPopupType('loading');
                            
                            try {
                                // Update Actual End Time on Visit
                                const updateResponse = await fetch(`${sfInstanceUrl}/services/data/v58.0/sobjects/Visit/${visit.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Authorization': `Bearer ${sfToken}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ 
                                        Actual_End_Time__c: new Date().toISOString()
                                    }),
                                });
                                
                                if (!updateResponse.ok) {
                                    const errorData = await updateResponse.json();
                                    throw new Error(errorData[0]?.message || 'Failed to update end time');
                                }
                                
                                setIsCheckedIn(false);
                                visit.actualEndTime = new Date().toISOString();
                                
                                setPopupTitle('👋 Checked Out!');
                                setPopupMessage(`Successfully checked out. Have a great day!`);
                                setPopupType('success');
                                
                            } catch (error) {
                                setPopupTitle('Error');
                                setPopupMessage(error.message);
                                setPopupType('error');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
            return;
        }
    } catch (error) {
        console.error('Check In error:', error);
        setPopupTitle('Check In Failed');
        setPopupMessage(error.message);
        setPopupType('error');
    } finally {
        setLoading(false);
    }
};

// Add CustomPopup component at the end of return, before closing tags
<CustomPopup
    visible={popupVisible}
    title={popupTitle}
    message={popupMessage}
    type={popupType}
    onClose={() => {
        setPopupVisible(false);
        if (popupType === 'success' && !isCheckedIn) {
            // Refresh the screen after checkout
            navigation.setParams({ visit: { ...visit } });
        }
    }}
    loading={loading && popupType === 'loading'}
/>