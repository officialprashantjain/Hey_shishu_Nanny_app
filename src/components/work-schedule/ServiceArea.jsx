import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { addServiceArea, getServiceAreas } from './../../services/nannyService';
import { colors } from './../../../constants/color';
import { fonts } from './../../../constants/font';
import { useAlert } from '../../contexts/AlertContext';

export default function ServiceArea() {
  const [cityDataSet, setCityDataSet] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const [areaDataSet, setAreaDataSet] = useState([]);
  const [areaLoading, setAreaLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  const [radius, setRadius] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [initialCity, setInitialCity] = useState(null);
  const [initialArea, setInitialArea] = useState(null);
  
  const { showAlert } = useAlert();

  // Debounce refs
  const citySearchTimeout = useRef(null);
  const areaSearchTimeout = useRef(null);
  const dropdownControllerCity = useRef(null);
  const dropdownControllerArea = useRef(null);

  useEffect(() => {
    fetchInitialServiceArea();
  }, []);

  const fetchInitialServiceArea = async () => {
    try {
      const response = await getServiceAreas();
      if (response?.data?.serviceAreas?.length > 0) {
        const areaData = response.data.serviceAreas[0];
        
        const existingCity = {
          id: 'initial_city',
          title: areaData.city,
          city: areaData.city,
        };
        const existingArea = {
          id: 'initial_area',
          title: areaData.area,
          area: areaData.area,
          city: areaData.city,
          lat: areaData.location.coordinates[1],
          lng: areaData.location.coordinates[0],
          pincode: areaData.pincode,
        };

        setInitialCity(existingCity);
        setInitialArea(existingArea);
        
        setCityDataSet([existingCity]);
        setAreaDataSet([existingArea]);
        
        setSelectedCity(existingCity);
        setSelectedArea(existingArea);
        setRadius(areaData.radiusKm || 5);
      }
    } catch (error) {
      console.log('Error fetching initial service area:', error);
    } finally {
      setIsFetchingInitial(false);
    }
  };

  const fetchCities = async (query) => {
    if (!query || query.length < 3) return;
    setCityLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=city&addressdetails=1&limit=5`;
      console.log('[Nominatim City Search Request] URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HeyShishuApp/1.0 (contact@heyshishu.com)'
        }
      });
      
      console.log('[Nominatim City Search Response] Status:', response.status);
      
      const text = await response.text();
      console.log('[Nominatim City Search Raw Response]:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${text}`);
      }
      
      const data = JSON.parse(text);
      const suggestions = data.map((item) => ({
        id: item.place_id.toString(),
        title: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village || item.name,
      }));
      setCityDataSet(suggestions);
    } catch (error) {
      console.error('Error fetching cities', error);
    } finally {
      setCityLoading(false);
    }
  };

  const fetchAreas = async (query) => {
    if (!query || query.length < 3 || !selectedCity) return;
    setAreaLoading(true);
    try {
      const cityStr = selectedCity.city || selectedCity.title.split(',')[0];
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)},${encodeURIComponent(cityStr)}&addressdetails=1&limit=5`;
      console.log('[Nominatim Area Search Request] URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HeyShishuApp/1.0 (contact@heyshishu.com)'
        }
      });
      
      console.log('[Nominatim Area Search Response] Status:', response.status);
      
      const text = await response.text();
      console.log('[Nominatim Area Search Raw Response]:', text);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${text}`);
      }
      
      const data = JSON.parse(text);
      const suggestions = data.map((item) => ({
        id: item.place_id.toString(),
        title: item.display_name,
        area: item.name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        pincode: item.address?.postcode || '',
        city: item.address?.city || cityStr,
      }));
      setAreaDataSet(suggestions);
    } catch (error) {
      console.error('Error fetching areas', error);
    } finally {
      setAreaLoading(false);
    }
  };

  const handleCitySearch = (query) => {
    if (citySearchTimeout.current) clearTimeout(citySearchTimeout.current);
    citySearchTimeout.current = setTimeout(() => {
      fetchCities(query);
    }, 800);
  };

  const handleAreaSearch = (query) => {
    if (areaSearchTimeout.current) clearTimeout(areaSearchTimeout.current);
    areaSearchTimeout.current = setTimeout(() => {
      fetchAreas(query);
    }, 800);
  };

  const handleSave = async () => {
    if (!selectedCity) return showAlert('Error', 'Please select a city first');
    if (!selectedArea) return showAlert('Error', 'Please select an area');
    if (!selectedArea.lat || !selectedArea.lng) return showAlert('Error', 'Invalid area location data');

    setIsSaving(true);
    try {
      const payload = {
        lat: selectedArea.lat,
        lng: selectedArea.lng,
        city: selectedArea.city,
        area: selectedArea.area,
        pincode: selectedArea.pincode || '000000',
        radiusKm: radius,
      };

      const response = await addServiceArea(payload);
      if (response.status === 'success') {
        showAlert('Success', 'Service area added successfully');
      } else {
        throw new Error(response.message || 'Failed to add service area');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', error.message || 'Error occurred while saving service area');
    } finally {
      setIsSaving(false);
    }
  };

  if (isFetchingInitial) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <Text style={styles.headerTitle}>Add Service Area</Text>
        <Text style={styles.subtext}>Set your working location boundary.</Text>

        {/* City Selection */}
        <View style={[styles.fieldContainer, Platform.OS === 'android' ? { elevation: 2 } : { zIndex: 2 }]}>
          <Text style={styles.label}>1. Search City</Text>
          <AutocompleteDropdown
            ref={dropdownControllerCity}
            clearOnFocus={false}
            closeOnBlur={true}
            closeOnSubmit={false}
            dataSet={cityDataSet}
            {...(initialCity && { initialValue: initialCity })}
            onChangeText={handleCitySearch}
            onSelectItem={(item) => {
              if (item) {
                setSelectedCity(item);
                setSelectedArea(null);
                setAreaDataSet([]);
              }
            }}
            textInputProps={{
              placeholder: 'E.g. Indore',
              autoCorrect: false,
              style: styles.input,
            }}
            rightButtonsContainerStyle={styles.rightButtonsContainer}
            inputContainerStyle={styles.inputContainer}
            suggestionsListContainerStyle={styles.suggestionsContainer}
            loading={cityLoading}
            EmptyResultComponent={<Text style={styles.emptyText}>No cities found</Text>}
          />
        </View>

        {/* Area Selection */}
        <View style={[styles.fieldContainer, { opacity: selectedCity ? 1 : 0.5 }, Platform.OS === 'android' ? { elevation: 1 } : { zIndex: 1 }]} pointerEvents={selectedCity ? 'auto' : 'none'}>
          <Text style={styles.label}>2. Search Area</Text>
          <AutocompleteDropdown
            ref={dropdownControllerArea}
            clearOnFocus={false}
            closeOnBlur={true}
            closeOnSubmit={false}
            dataSet={areaDataSet}
            {...(initialArea && { initialValue: initialArea })}
            onChangeText={handleAreaSearch}
            onSelectItem={(item) => item && setSelectedArea(item)}
            textInputProps={{
              placeholder: 'E.g. Vijay Nagar',
              autoCorrect: false,
              style: styles.input,
            }}
            rightButtonsContainerStyle={styles.rightButtonsContainer}
            inputContainerStyle={styles.inputContainer}
            suggestionsListContainerStyle={styles.suggestionsContainer}
            loading={areaLoading}
            EmptyResultComponent={<Text style={styles.emptyText}>{selectedCity ? "No areas found" : "Select city first"}</Text>}
          />
        </View>

        {/* Radius Selection */}
        <View style={[styles.fieldContainer, { zIndex: -1 }]}>
          <Text style={styles.label}>3. Select Service Radius</Text>
          <View style={styles.radiusOptions}>
            {[5, 10, 15, 20].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>{r} KM</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save Area</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  headerTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 24,
    color: colors.primary,
    marginBottom: 5,
  },
  subtext: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginBottom: 25,
  },
  fieldContainer: {
    marginBottom: 25,
  },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    color: colors.description,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: 10,
  },
  input: {
    color: colors.description,
    fontFamily: fonts.rubik,
    fontSize: 16,
    paddingHorizontal: 15,
  },
  rightButtonsContainer: {
    right: 8,
    height: 30,
    alignSelf: 'center',
  },
  suggestionsContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  emptyText: {
    padding: 15,
    textAlign: 'center',
    color: colors.gray,
    fontFamily: fonts.rubik,
  },
  radiusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  radiusBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  radiusBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radiusText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
  },
  radiusTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fonts.rubik,
    fontWeight: 'bold',
  },
});
