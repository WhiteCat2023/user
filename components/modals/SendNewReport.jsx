import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import { ChevronDown, InfoIcon, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { uploadUserReport } from '../../api/controller/storage.controller';
import { Button, ButtonText } from '../../components/ui/button';
import { Divider } from '../../components/ui/divider';
import { FormControl, FormControlHelper, FormControlHelperText, FormControlLabel, FormControlLabelText } from '../../components/ui/form-control';
import { Heading } from '../../components/ui/heading';
import { HStack } from '../../components/ui/hstack';
import { Icon } from '../../components/ui/icon';
import { Image } from '../../components/ui/image';
import { Input, InputField } from '../../components/ui/input';
import { Pressable } from '../../components/ui/pressable';
import { useAuth } from '../../context/AuthContext';
import { HttpStatus } from '../../enums/status';
import { TierList } from '../../enums/tier';


const SendNewReport = ({ visible, onClose }) => {
    const [input, setInput] = useState({
        title: "",
        description: "",
        tier: "",
        timestamp: new Date(),
        images: [],
        location: null,
    });

    const [showTierModal, setShowTierModal] = useState(false);
    const [showLegendModal, setShowLegendModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [address, setAddress] = useState("Fetching location...");

    const [isError, setError] = useState({
        title: false,
        description: false,
        tier: false,
        images: false,
        location: false,
    });

    const { user } = useAuth();

    useEffect(() => {
        if (visible) {
            (async () => {
                try {
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert("Permission Denied", "Permission to access location was denied.");
                        setAddress("Location permission denied.");
                        setError(prev => ({ ...prev, location: true }));
                        return;
                    }

                    let location = await Location.getCurrentPositionAsync({});
                    const { latitude, longitude } = location.coords;
                    handleChange('location', [longitude, latitude]);

                    let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
                    if (reverseGeocode.length > 0) {
                        const loc = reverseGeocode[0];
                        const fullAddress = `${loc.street || ''}, ${loc.district || ''}, ${loc.city || ''}, ${loc.subregion || ''}`;
                        setAddress(fullAddress.replace(/^, |, $/g, '')); // Clean up leading/trailing commas
                    }

                } catch (error) {
                    console.error("Failed to get location:", error);
                    setAddress("Failed to fetch location.");
                    setError(prev => ({ ...prev, location: true }));
                    Alert.alert("Location Error", "Failed to fetch location. Please ensure your location services are enabled.");
                }
            })();
        }
    }, [visible]);

    const handleChange = (field, value) => {
        setInput((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (value) {
            setError(prev => ({ ...prev, [field]: false }));
        }
    };

    const handleTierChange = (value) => {
        handleChange('tier', value);
        setShowTierModal(false);
    };

    const validateInput = () => {
        const errors = {
            title: input.title === "",
            description: input.description === "",
            tier: input.tier === "",
            images: input.images.length === 0,
            location: !input.location,
        };

        setError(errors);
        return !Object.values(errors).some((val) => val === true);
    };

    const handleOnClose = () => {
        onClose();
        setInput({
            title: "",
            description: "",
            tier: "",
            timestamp: new Date(),
            images: [],
            location: null,
        });
        setAddress("Fetching location...");
        setError({
            title: false,
            description: false,
            tier: false,
            images: false,
            location: false,
        });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
        });

        if (!result.canceled && result.assets) {
            if (input.images.length + result.assets.length > 3) {
                Alert.alert("You can only upload a maximum of 3 images.");
                return;
            }
            setInput((prev) => ({ ...prev, images: [...prev.images, ...result.assets] }));
            setError(prev => ({ ...prev, images: false }));
        }
    };

    const handleSubmit = async () => {
        if (validateInput()) {
            setIsSubmitting(true);
            try {
                const result = await uploadUserReport(input, user);
                if (result.status === HttpStatus.OK) {
                    setShowSuccessModal(true);
                } else {
                    Alert.alert("Error", result.message || "Failed to submit report.");
                }
            } catch (error) {
                Alert.alert("Error", "An unexpected error occurred while submitting the report.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            Alert.alert("Validation Error", "Please fill in all required fields and upload at least one image.");
        }
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        handleOnClose();
    };

    const removeImage = (index) => {
        const newImages = [...input.images];
        newImages.splice(index, 1);
        setInput(prev => ({ ...prev, images: newImages }));
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleOnClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <ScrollView contentContainerStyle={{ alignItems: 'center' }} style={{width: '100%'}}>
                        <View style={styles.header}>
                            <Heading style={styles.modalTitle}>SUBMIT A REPORT</Heading>
                            <Pressable onPress={handleOnClose} style={styles.closeButton}>
                                <Icon as={X} size="md" />
                            </Pressable>
                        </View>
                        <Divider style={styles.divider} />

                        <FormControl style={styles.formControl} isInvalid={isError.title}>
                            <FormControlLabel>
                                <FormControlLabelText style={styles.formLabel}>Report Title <Text style={{color: 'red'}}>*</Text></FormControlLabelText>
                            </FormControlLabel>
                            <Input style={styles.input}>
                                <InputField
                                    placeholder="Write your report title here."
                                    value={input.title}
                                    onChangeText={(text) => handleChange('title', text)}
                                />
                            </Input>
                        </FormControl>

                        <FormControl style={styles.formControl} isInvalid={isError.description}>
                            <FormControlLabel>
                                <FormControlLabelText style={styles.formLabel}>Report Description <Text style={{color: 'red'}}>*</Text></FormControlLabelText>
                            </FormControlLabel>
                            <TextInput
                                placeholder="Write your report Description here."
                                value={input.description}
                                onChangeText={(text) => handleChange('description', text)}
                                multiline={true}
                                numberOfLines={4}
                                style={[styles.textArea, isError.description && { borderWidth: 1, borderColor: 'red' }]}
                            />
                        </FormControl>

                        <FormControl style={styles.formControl} isInvalid={isError.tier}>
                            <FormControlLabel>
                                <FormControlLabelText style={styles.formLabel}>Report Tierlist <Text style={{color: 'red'}}>*</Text></FormControlLabelText>
                            </FormControlLabel>
                            <FormControlHelper>
                                <FormControlHelperText style={{ fontSize: 12, marginTop: -10 }}>How urgent the report?</FormControlHelperText>
                            </FormControlHelper>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ flex: 1 }}>
                                    <TouchableOpacity
                                        onPress={() => setShowTierModal(true)}
                                        className={`border rounded-md p-3 bg-gray-50 flex-row items-center justify-between mr-3 ${isError.tier ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <Text className={input.tier ? "text-black" : "text-gray-400"}>
                                            {input.tier || "Select report tier"}
                                        </Text>
                                        <ChevronDown size={20} color="gray" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity onPress={() => setShowLegendModal(true)}>
                                    <Icon as={InfoIcon} size="md" style={{ marginLeft: 10 }} />
                                </TouchableOpacity>
                            </View>
                        </FormControl>

                        <FormControl style={styles.formControl} isInvalid={isError.location}>
                            <FormControlLabel>
                                <FormControlLabelText style={styles.formLabel}>Location Coordinates</FormControlLabelText>
                            </FormControlLabel>
                            <View style={styles.locationContainer}>
                                <Text style={styles.locationText}>
                                    {address}
                                </Text>
                            </View>
                            {isError.location && <FormControlLabelText style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Location is required.</FormControlLabelText>}
                        </FormControl>

                        <FormControl style={styles.formControl} isInvalid={isError.images}>
                            <Button style={[styles.button, styles.uploadButton]} onPress={pickImage}>
                                <ButtonText style={{ fontSize: 15, height: 20 }}>Upload Image (Max 3)</ButtonText>
                            </Button>
                            {isError.images && <FormControlLabelText style={{ color: 'red', fontSize: 12, marginTop: 4 }}>Please upload at least one image.</FormControlLabelText>}
                        </FormControl>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 1 }}>
                            <HStack space="sm" style={{ flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                                {input.images.map((image, index) => (
                                    <View key={index} style={{ position: 'relative', margin: 5, }}>
                                        <Image source={{ uri: image.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} alt={`report-image-${index}`} />
                                        <Pressable onPress={() => removeImage(index)} style={styles.removeImageButton}>
                                            <Icon as={X} size="sm" color="white" />
                                        </Pressable>
                                    </View>
                                ))}
                            </HStack>
                        </ScrollView>


                        <View style={styles.actionButtons}>
                            <Button style={[styles.button, styles.submitButton]} onPress={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <ButtonText style={{ fontSize: 13, height: 20 }}>Submit Report</ButtonText>
                                )}
                            </Button>
                            <Button style={[styles.button, styles.deleteButton]} onPress={handleOnClose} disabled={isSubmitting}>
                                <ButtonText style={{ fontSize: 13, height: 20 }}>Delete Report</ButtonText>
                            </Button>
                        </View>
                    </ScrollView>
                </View>
            </View>
            <Modal
                visible={showTierModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowTierModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setShowTierModal(false)}
                >
                    <View className="bg-white rounded-lg w-4/5 max-w-sm">
                        <View className="bg-gray-200 p-3 rounded-t-lg">
                            <Text className="text-center text-gray-600 font-medium">Select report tier</Text>
                        </View>
                        {TierList.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => handleTierChange(option.value)}
                                className="p-4 border-b border-gray-100"
                            >
                                <Text className="text-black text-base">{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
            <Modal
                visible={showLegendModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowLegendModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setShowLegendModal(false)}
                >
                    <View style={styles.tierModalContent} className="p-4">
                        <Text className="font-bold text-lg mb-2">Legend:</Text>
                        <View className="mb-1">
                            <Text>
                                <Text className="font-bold text-green-600">Low</Text>
                                - use this to identify that the report is in low
                                priority/not so important, can wait longer or just for
                                awareness, no action needed.
                            </Text>
                        </View>
                        <View className="mb-1">
                            <Text>
                                <Text className="font-bold text-yellow-500">Medium</Text>
                                - use this to identify that the report is of medium
                                priority, needs attention but not immediate action.
                            </Text>
                        </View>
                        <View className="mb-1">
                            <Text>
                                <Text className="font-bold text-orange-500">High</Text>
                                - use this to identify that the report is of high
                                priority, needs attention and action soon.
                            </Text>
                        </View>
                        <View>
                            <Text>
                                <Text className="font-bold text-red-600">Emergency</Text>
                                - use this to identify that the report is urgent and
                                needs immediate attention action.
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="fade"
                onRequestClose={handleSuccessModalClose}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleSuccessModalClose}
                        >
                            <X size={24} color="black" marginRight={12} marginTop={12} />
                        </TouchableOpacity>

                        <Text style={{ fontFamily: 'Poppins', fontSize: 30, textAlign: 'center', }}>
                            REPORT SUBMITTED
                        </Text>
                
                        <Image
                                      source={require("@/assets/images/report-icon.png")}
                                      style={{ width: 120, height: 120, marginBottom: 16 }}
                                      resizeMode="contain"
                                    />
                
                        <Text style={{ fontSize: 18, marginBottom: 24, marginTop: 10, textAlign: 'center' }}>
                            Report Submitted <Text style={{ fontWeight: 'bold', color: '#28a745' }}>Successfully!</Text>
                        </Text>
                
                        <TouchableOpacity
                            onPress={handleSuccessModalClose}
                            style={{ backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 8, alignItems: 'center', width: '100%' }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                                Okay
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    divider: {
        width: '100%',
        marginVertical: 15,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    modalTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        flex: 1,
        fontSize: 24,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    formControl: {
        width: '100%',
        marginBottom: 15,
    },
    formLabel: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    locationContainer: {
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        padding: 10,
        width: '100%',
    },
    locationText: {
        color: '#333',
    },
    input: {
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
    },
    selectTrigger: {
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 8,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        backgroundColor: 'white',
    },
    selectText: {
        color: 'black',
    },
    selectPlaceholder: {
        color: '#A0A0A0',
    },
    textArea: {
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        height: 100,
        padding: 10,
        textAlignVertical: 'top',
        width: '100%',
    },
    selectIcon: {
        marginRight: 10
    },
    button: {
        borderRadius: 10,
        padding: 10,
        elevation: 2,
        marginTop: 10,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    uploadButton: {
        backgroundColor: '#28a745',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
       
    },
    submitButton: {
        backgroundColor: '#fd7e14', // Orange
        flex: 1,
        marginRight: 2,
    },
    deleteButton: {
        backgroundColor: '#dc3545', // Red
        flex: 1,
        marginLeft: 2,
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tierModalContent: {
        backgroundColor: 'white',
        borderRadius: 8,
        width: '80%',
        maxWidth: 300,
    },
    tierModalHeader: {
        backgroundColor: '#F0F0F0',
        padding: 12,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    tierModalHeaderText: {
        textAlign: 'center',
        fontWeight: '500',
        color: '#666',
    },
    tierModalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    tierModalItemText: {
        textAlign: 'center',
        fontSize: 16,
    },
});

export default SendNewReport;
