<template>
  <div class="bg-osdm-bg-primary flex flex-row justify-center p-4">
    <sbb-card>
      <div class="flex flex-col xl:flex-row justify-center items-center xl:items-start align-middle gap-4">

        <div class="flex flex-col gap-2 w-full xl:w-auto">
          <InputPlace name="Origin" aria-placeholder="origin" :select-callback="setOrigin" :selected-place="origin" />
          <div class="flex flex-col gap-2">
            <div class="flex gap-2 items-center">
              <select v-model="selectedOfferModeString" class="border rounded px-2 py-1 text-sm flex-1">
                <option value="">-- Offer Mode --</option>
                <option
                  v-for="offerMode in offerModes"
                  :key="offerMode.value"
                  :value="offerMode.value"
                >
                  {{ offerMode.label }}
                </option>
              </select>
              <sbb-button size="s" variant="secondary" @click="clearOfferMode" :disabled="!selectedOfferMode">
                Clear
              </sbb-button>
            </div>
            <div class="flex gap-2 items-center">
              <select class="border rounded px-2 py-1 text-sm flex-1" @change="(event: Event) => addTravelClass(event)">
                <option value="">-- Travel Class --</option>
                <option
                  v-for="travelClass in travelClasses"
                  :key="`${travelClass.value}`"
                  :value="travelClass.value"
                  :disabled="selectedTravelClasses.includes(travelClass.value)"
                >
                  {{ travelClass.label }}
                </option>
              </select>
              <sbb-button size="s" variant="secondary" @click="clearTravelClasses" :disabled="selectedTravelClasses.length === 0">
                Clear
              </sbb-button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tc in selectedTravelClasses"
                :key="tc"
                class="bg-osdm-bg-secondary text-xs px-2 py-1 rounded flex items-center gap-1"
              >
                {{ tc }}
                <button class="text-red-600" @click="removeTravelClass(tc)">&times;</button>
              </span>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 w-full xl:w-auto">
          <InputPlace name="Destination" aria-placeholder="destination" :select-callback="setDestination"
            :selected-place="destination" />
          <ViasInput aria-placeholder="vias" :select-callback="setVias" :selectedVias="vias" />
        </div>
        <div class="flex flex-col gap-2 w-full xl:w-auto">
          <InputDate aria-placeholder="date" name="Date" :value="date" :select-callback="setDate" />
          <PassengerInput class="hidden xl:block" aria-placeholder="passengers" :select-callback="setPassengers"
            :selected-passengers="passengers" />
        </div>
        <div class="flex gap-2 xl:flex-col items-center xl:items-stretch">
          <InputTime aria-placeholder="time" name="Time" :value="date" :select-callback="setTime" />
          <sbb-toggle aria-placeholder="isArrival" v-model="dateReferenceTypeString" size="s">
            <sbb-toggle-option value="DEPARTURE">Departure</sbb-toggle-option>
            <sbb-toggle-option value="ARRIVAL">Arrival</sbb-toggle-option>
          </sbb-toggle>
        </div>
        <PassengerInput class="xl:hidden" aria-placeholder="passengers" :select-callback="setPassengers"
          :selected-passengers="passengers" />
        <sbb-button aria-placeholder="search" class="self-center" size="m
           " icon-name="arrow-right-small" @click="handleSearchTrip" :disabled="!origin || !destination">
          <span v-if="!loading">Search</span>
          <sbb-loading-indicator v-else variant="circle" size="s" color="white"></sbb-loading-indicator>
        </sbb-button>
      </div>
    </sbb-card>
  </div>
</template>

<script lang="ts">
import { SbbButtonElement as SbbButton } from '@sbb-esta/lyne-elements/button'
import { SbbCardElement as SbbCard } from '@sbb-esta/lyne-elements/card'
import { SbbToggleElement as SbbToggle } from '@sbb-esta/lyne-elements/toggle'
import { SbbLoadingIndicatorElement as SbbLoadingIndicator } from '@sbb-esta/lyne-elements/loading-indicator'
import InputDate from '../atoms/InputDate.vue'
import InputPlace from '../atoms/InputPlace.vue'
import InputTime from '../atoms/InputTime.vue'
import type { components } from '@/schemas/schema'
import { DateReferenceType, placeToSearchCriteriaLocation, useTripsStore } from '@/stores/trips'
import PassengerInput from './PassengerInput.vue'
import ViasInput from './ViasInput.vue'
import { usePassengerStore } from '@/stores/passengers'
import { useOfferStore } from '@/stores/offers'

type TravelClassOption = {
  value: string
  label: string
}

type OfferModeOption = {
  value: OfferMode
  label: string
}

type OfferMode = components['schemas']['OfferMode']

const TRAVEL_CLASS_VALUES = [
  'FIRST',
  'SECOND',
  'ANY_CLASS',
] as const

const OFFER_MODE_VALUES: OfferMode[] = ['COLLECTIVE', 'INDIVIDUAL']

export default {
  components: {
    InputDate,
    InputPlace,
    InputTime,
    SbbToggle,
    SbbButton,
    SbbCard,
    SbbLoadingIndicator,
    ViasInput,
    PassengerInput,
  },
  data(): {
    origin: components['schemas']['StopPlace'] | undefined
    destination: components['schemas']['StopPlace'] | undefined
    vias: components['schemas']['StopPlace'][]
    date: Date
    dateReferenceType: DateReferenceType,
  } {
    return {
      origin: useTripsStore().search?.origin,
      destination: useTripsStore().search?.destination,
      vias: useTripsStore().search?.vias ?? [],
      date: useTripsStore().search?.date ?? new Date(Date.now()),
      dateReferenceType: DateReferenceType.DEPARTURE,
    }
  },
  computed: {
    loading() {
      return useTripsStore().loading
    },
    travelClasses(): TravelClassOption[] {
        return TRAVEL_CLASS_VALUES.map((value) => ({
          value,
          label: value,
        }))
    },
    offerModes(): OfferModeOption[] {
      return OFFER_MODE_VALUES.map((value) => ({
        value,
        label: value,
      }))
    },
    selectedTravelClasses() {
      return useOfferStore().selectedTravelClasses
    },
    selectedOfferMode() {
      return useOfferStore().selectedOfferMode
    },
    passengers() {
      return usePassengerStore().passengers
    },
    selectedOfferModeString: {
      get(): OfferMode | '' {
        return useOfferStore().selectedOfferMode ?? ''
      },
      set(value: OfferMode | '') {
        useOfferStore().setOfferMode(value || undefined)
      },
    },
    dateReferenceTypeString: {
      get() {
        return this.dateReferenceType == DateReferenceType.DEPARTURE ? 'DEPARTURE' : 'ARRIVAL'
      },
      set(value: string) {
        if (value == 'ARRIVAL') {
          this.dateReferenceType = DateReferenceType.ARRIVAL
        } else {
          this.dateReferenceType = DateReferenceType.DEPARTURE
        }
      },
    },
  },
  methods: {
    setOrigin(selectedValue: components['schemas']['StopPlace']) {
      this.origin = selectedValue
    },
    setDestination(selectedValue: components['schemas']['StopPlace']) {
      this.destination = selectedValue
    },
    setDate(selectedDate: Date) {
      this.date.setFullYear(selectedDate.getFullYear())
      this.date.setMonth(selectedDate.getMonth())
      this.date.setDate(selectedDate.getDate())
    },
    setTime(setTime: Date | null) {
      if (setTime) {
        this.date.setHours(setTime.getHours())
        this.date.setMinutes(setTime.getMinutes())
      }
    },
    setVias(selectedValue: components['schemas']['StopPlace'][]) {
      this.vias = selectedValue
    },
    setPassengers(passengers: components['schemas']['Passenger'][]) {
      usePassengerStore().definePassengers(passengers)
    },
    addTravelClass(event: Event) {
      const select = event.target as HTMLSelectElement
      const value = select.value as string
      if (!value) return
      useOfferStore().addTravelClass(value)
      // reset select so same option can be re-chosen after removal
      select.value = ''
    },
    removeTravelClass(travelClass: string) {
      useOfferStore().removeTravelClass(travelClass)
    },
    clearTravelClasses() {
      useOfferStore().clearTravelClasses()
    },
    clearOfferMode() {
      useOfferStore().setOfferMode(undefined)
    },
    handleSearchTrip() {
      if (this.origin && this.destination) {
        this.$router.push({
          name: 'trips',
          query: {
            o: btoa(encodeURIComponent(JSON.stringify(placeToSearchCriteriaLocation(this.origin)))),
            d: btoa(
              encodeURIComponent(JSON.stringify(placeToSearchCriteriaLocation(this.destination))),
            ),
            t: this.date.toISOString(),
            tr: JSON.stringify(this.dateReferenceType == DateReferenceType.DEPARTURE),
            v: btoa(
              encodeURIComponent(
                JSON.stringify(this.vias.map((sv) => placeToSearchCriteriaLocation(sv))),
              ),
            ),
          },
        })
      }
    },
  },
}
</script>
