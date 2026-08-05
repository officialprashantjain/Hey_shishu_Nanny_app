import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addServiceArea,
  getServiceAreas,
  deleteServiceArea,
  getCountries,
  getStates,
  getCities,
  getAdminServiceAreas,
} from '../../services/nannyService';
import { colors } from '../../../constants/color';
import { fonts } from '../../../constants/font';
import { useAlert } from '../../contexts/AlertContext';

// ─── Small reusable dropdown selector component ───────────────────────────────
function Selector({ label, placeholder, value, options, onSelect, loading, disabled }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (!disabled) setOpen((prev) => !prev);
  };

  return (
    <View style={[selectorStyles.wrapper, disabled && selectorStyles.disabled]}>
      <Text style={selectorStyles.label}>{label}</Text>
      <TouchableOpacity style={selectorStyles.control} onPress={toggle} activeOpacity={0.8}>
        <Text style={[selectorStyles.valueText, !value && selectorStyles.placeholder]}>
          {value ? value.name : placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
        )}
      </TouchableOpacity>

      {open && options.length > 0 && (
        <View style={selectorStyles.dropdown}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt._id}
                style={[selectorStyles.option, value?._id === opt._id && selectorStyles.optionActive]}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    selectorStyles.optionText,
                    value?._id === opt._id && selectorStyles.optionTextActive,
                  ]}
                >
                  {opt.name}
                </Text>
                {value?._id === opt._id && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {open && !loading && options.length === 0 && (
        <View style={selectorStyles.dropdown}>
          <Text style={selectorStyles.emptyText}>No options available</Text>
        </View>
      )}
    </View>
  );
}

const selectorStyles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    fontWeight: '600',
    color: colors.description,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  valueText: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
    flex: 1,
  },
  placeholder: {
    color: '#AAAAAA',
  },
  dropdown: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionActive: {
    backgroundColor: '#F0FAF8',
  },
  optionText: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    color: colors.description,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    color: '#AAAAAA',
    fontFamily: fonts.rubik,
    fontSize: 14,
  },
});

// ─── Main ServiceArea Screen ─────────────────────────────────────────────────
export default function ServiceArea() {
  const { showAlert } = useAlert();

  // ── Dropdown data ──
  const [countries,    setCountries]    = useState([]);
  const [states,       setStates]       = useState([]);
  const [cities,       setCities]       = useState([]);
  const [adminAreas,   setAdminAreas]   = useState([]);

  // ── Selections ──
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState,   setSelectedState]   = useState(null);
  const [selectedCity,    setSelectedCity]     = useState(null);
  const [selectedArea,    setSelectedArea]     = useState(null);
  const [radiusKm,        setRadiusKm]         = useState(5);

  // ── Loading states ──
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates,    setLoadingStates]    = useState(false);
  const [loadingCities,    setLoadingCities]    = useState(false);
  const [loadingAreas,     setLoadingAreas]     = useState(false);
  const [isSaving,         setIsSaving]         = useState(false);
  const [loadingMy,        setLoadingMy]         = useState(true);

  // ── My saved service areas ──
  const [myAreas, setMyAreas] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // ── On mount: load countries and my saved areas ──
  useEffect(() => {
    fetchCountries();
    fetchMyAreas();
  }, []);

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const res = await getCountries();
      setCountries(res.data || []);
    } catch (e) {
      console.error('getCountries error:', e?.response?.data || e.message);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchMyAreas = async () => {
    setLoadingMy(true);
    try {
      const res = await getServiceAreas();
      setMyAreas(res.data?.serviceAreas || []);
    } catch (e) {
      console.error('getServiceAreas error:', e?.response?.data || e.message);
    } finally {
      setLoadingMy(false);
    }
  };

  // ── Cascade: Country → States ──
  const handleCountrySelect = async (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedArea(null);
    setStates([]);
    setCities([]);
    setAdminAreas([]);

    setLoadingStates(true);
    try {
      const res = await getStates(country._id);
      setStates(res.data || []);
    } catch (e) {
      console.error('getStates error:', e?.response?.data || e.message);
    } finally {
      setLoadingStates(false);
    }
  };

  // ── Cascade: State → Cities ──
  const handleStateSelect = async (state) => {
    setSelectedState(state);
    setSelectedCity(null);
    setSelectedArea(null);
    setCities([]);
    setAdminAreas([]);

    setLoadingCities(true);
    try {
      const res = await getCities(state._id);
      setCities(res.data || []);
    } catch (e) {
      console.error('getCities error:', e?.response?.data || e.message);
    } finally {
      setLoadingCities(false);
    }
  };

  // ── Cascade: City → Admin Service Areas ──
  const handleCitySelect = async (city) => {
    setSelectedCity(city);
    setSelectedArea(null);
    setAdminAreas([]);

    setLoadingAreas(true);
    try {
      const res = await getAdminServiceAreas(city._id);
      setAdminAreas(res.data || []);
    } catch (e) {
      console.error('getAdminServiceAreas error:', e?.response?.data || e.message);
    } finally {
      setLoadingAreas(false);
    }
  };

  // ── Save ──
  const handleSave = async () => {
    if (!selectedArea) return showAlert('Error', 'Please select a service area');

    setIsSaving(true);
    try {
      await addServiceArea({ serviceAreaId: selectedArea._id, radiusKm });
      showAlert('Success', `"${selectedArea.name}" added to your service areas`);
      // Reset form
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedCity(null);
      setSelectedArea(null);
      setStates([]);
      setCities([]);
      setAdminAreas([]);
      setRadiusKm(5);
      fetchMyAreas(); // refresh list
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to save area';
      showAlert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (areaId, areaName) => {
    setDeletingId(areaId);
    try {
      await deleteServiceArea(areaId);
      setMyAreas((prev) => prev.filter((a) => a._id !== areaId));
    } catch (e) {
      showAlert('Error', e?.response?.data?.message || 'Could not remove area');
    } finally {
      setDeletingId(null);
    }
  };

  const isFormReady = selectedArea !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {/* ── Header ── */}
        <Text style={styles.sectionTitle}>Add Service Area</Text>
        <Text style={styles.subtext}>
          Select your preferred working location from admin-managed areas.
        </Text>

        {/* ── Step indicator ── */}
        <View style={styles.stepsRow}>
          {['Country', 'State', 'City', 'Area'].map((step, i) => {
            const done = [selectedCountry, selectedState, selectedCity, selectedArea][i] !== null;
            return (
              <View key={step} style={styles.stepItem}>
                <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
                  {done ? (
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  ) : (
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{step}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {/* Country */}
          <Selector
            label="1. Select Country"
            placeholder={loadingCountries ? 'Loading...' : 'Choose country'}
            value={selectedCountry}
            options={countries}
            onSelect={handleCountrySelect}
            loading={loadingCountries}
            disabled={false}
          />

          {/* State */}
          <Selector
            label="2. Select State"
            placeholder={selectedCountry ? (loadingStates ? 'Loading...' : 'Choose state') : 'Select country first'}
            value={selectedState}
            options={states}
            onSelect={handleStateSelect}
            loading={loadingStates}
            disabled={!selectedCountry}
          />

          {/* City */}
          <Selector
            label="3. Select City"
            placeholder={selectedState ? (loadingCities ? 'Loading...' : 'Choose city') : 'Select state first'}
            value={selectedCity}
            options={cities}
            onSelect={handleCitySelect}
            loading={loadingCities}
            disabled={!selectedState}
          />

          {/* Service Area */}
          <Selector
            label="4. Select Service Area"
            placeholder={selectedCity ? (loadingAreas ? 'Loading...' : adminAreas.length === 0 ? 'No areas available for this city' : 'Choose area') : 'Select city first'}
            value={selectedArea}
            options={adminAreas}
            onSelect={setSelectedArea}
            loading={loadingAreas}
            disabled={!selectedCity || adminAreas.length === 0}
          />

          {/* Show pricing preview when area selected */}
          {selectedArea && (
            <View style={styles.priceCard}>
              <Text style={styles.priceTitle}>📍 {selectedArea.name}</Text>
              <View style={styles.priceRow}>
                <PriceChip label="Hourly" value={`₹${selectedArea.prices?.hourly}`} />
                <PriceChip label="Daily"  value={`₹${selectedArea.prices?.daily}`}  />
                <PriceChip label="Weekly" value={`₹${selectedArea.prices?.weekly}`} />
              </View>
              <Text style={styles.radiusHint}>
                Coverage radius: {selectedArea.radius >= 1000
                  ? `${(selectedArea.radius / 1000).toFixed(1)} km`
                  : `${selectedArea.radius} m`}
              </Text>
            </View>
          )}

          {/* Travel Radius */}
          <View style={styles.radiusSection}>
            <Text style={styles.radiusSectionLabel}>5. Your travel radius</Text>
            <View style={styles.radiusOptions}>
              {[5, 10, 15, 20].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusBtn, radiusKm === r && styles.radiusBtnActive]}
                  onPress={() => setRadiusKm(r)}
                >
                  <Text style={[styles.radiusText, radiusKm === r && styles.radiusTextActive]}>
                    {r} KM
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, !isFormReady && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isFormReady || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveBtnText}>Save Area</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── My Saved Service Areas ── */}
        <Text style={styles.savedTitle}>My Service Areas</Text>

        {loadingMy ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : myAreas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={40} color={colors.gray} />
            <Text style={styles.emptyStateText}>No service areas added yet</Text>
          </View>
        ) : (
          myAreas.map((item) => (
            <View key={item._id} style={styles.savedCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.savedAreaName}>
                  {item.serviceAreaId?.name || item.area}
                </Text>
                <Text style={styles.savedAreaMeta}>
                  {item.city} · {item.radiusKm} km travel radius
                </Text>
                {item.serviceAreaId?.prices && (
                  <Text style={styles.savedPrices}>
                    ₹{item.serviceAreaId.prices.hourly}/hr ·
                    ₹{item.serviceAreaId.prices.daily}/day ·
                    ₹{item.serviceAreaId.prices.weekly}/wk
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item._id, item.area)}
                disabled={deletingId === item._id}
                style={styles.deleteBtn}
              >
                {deletingId === item._id ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Price chip helper ─────────────────────────────────────────────
function PriceChip({ label, value }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.chipLabel}>{label}</Text>
      <Text style={chipStyles.chipValue}>{value}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F0FAF8',
    borderRadius: 10,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#C8E6E2',
  },
  chipLabel: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
});

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontFamily: fonts.chocoShake,
    fontSize: 26,
    color: colors.primary,
    marginBottom: 4,
  },
  subtext: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginBottom: 20,
    opacity: 0.7,
  },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
  },
  stepNum: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  stepLabel: {
    fontFamily: fonts.rubik,
    fontSize: 11,
    color: colors.gray,
  },
  stepLabelDone: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Price preview
  priceCard: {
    backgroundColor: '#F0FAF8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6E2',
  },
  priceTitle: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  radiusHint: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.description,
    opacity: 0.6,
    textAlign: 'center',
  },

  // Radius
  radiusSection: {
    marginBottom: 20,
  },
  radiusSectionLabel: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    fontWeight: '600',
    color: colors.description,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radiusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.gray,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  radiusBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radiusText: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
    fontWeight: '600',
  },
  radiusTextActive: {
    color: colors.white,
  },

  // Save button
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: colors.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.rubik,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Saved areas
  savedTitle: {
    fontFamily: fonts.rubik,
    fontSize: 16,
    fontWeight: '700',
    color: colors.description,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  savedCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  savedAreaName: {
    fontFamily: fonts.rubik,
    fontSize: 15,
    fontWeight: '700',
    color: colors.description,
    marginBottom: 3,
  },
  savedAreaMeta: {
    fontFamily: fonts.rubik,
    fontSize: 13,
    color: colors.description,
    opacity: 0.6,
    marginBottom: 3,
  },
  savedPrices: {
    fontFamily: fonts.rubik,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    opacity: 0.5,
  },
  emptyStateText: {
    fontFamily: fonts.rubik,
    fontSize: 14,
    color: colors.description,
    marginTop: 8,
  },
});
