import { defineStore } from 'pinia'
import type { components } from '@/schemas/schema'
import { displayPrice, extractPriceFromOffer } from '@/helpers/price'

type OfferMode = components['schemas']['OfferMode']

export interface SelectedPlace {
  coachNumber: string
  placeNumber: string
  passengerRef: string
}

export interface SelectedReferencePlace {
  coachNumber: string
  placeNumber: string
}

export interface SelectedAccommodation {
  passengerRefs: string[]
  accommodationType: string
  accommodationSubType: string
}

export interface SelectedPlaceSelection {
  reservationId: string
  places?: SelectedPlace[]
  passengerRefs?: string[]
  referencePlace?: SelectedReferencePlace
  accommodations?: SelectedAccommodation[]
}

export class OfferListError {
  title: string
  description: string
  icon: string

  constructor(title: string, description: string, icon: string) {
    this.title = title
    this.description = description
    this.icon = icon
  }
}

export const useOfferStore = defineStore('offer', {
  state: (): {
    selectedTravelClasses: string[]
    selectedOfferMode: OfferMode | undefined
    offers: components['schemas']['Offer'][]
    selectedOffer: components['schemas']['Offer'] | undefined
    selectedAncilleries: components['schemas']['AncillaryOfferPart'][]
    selectedPlaceSelections: SelectedPlaceSelection[]
    error: OfferListError | undefined
    loading: boolean
  } => ({
    selectedTravelClasses: [],
    selectedOfferMode: undefined,
    offers: [],
    selectedOffer: undefined,
    selectedAncilleries: [],
    selectedPlaceSelections: [],
    loading: false,
    error: undefined,
  }),
  actions: {
    setOffers(offers: components['schemas']['Offer'][]) {
      this.offers = offers
      this.loading = false
      this.error = undefined
    },
    setLoading(value: boolean) {
      this.loading = value
    },
    setSelectOfferAndAncillaries(
      offer: components['schemas']['Offer'],
      ancillaries: components['schemas']['AncillaryOfferPart'][],
    ) {
      this.selectedOffer = offer
      this.selectedAncilleries = ancillaries
      this.selectedPlaceSelections = []
    },
    setSelectOfferAncillariesAndPlaces(
      offer: components['schemas']['Offer'],
      ancillaries: components['schemas']['AncillaryOfferPart'][],
      placeSelections: SelectedPlaceSelection[],
    ) {
      this.selectedOffer = offer
      this.selectedAncilleries = ancillaries
      this.selectedPlaceSelections = JSON.parse(JSON.stringify(placeSelections ?? []))
    },
    addTravelClass(travelClass: string) {
      if (!travelClass) return
      if (!this.selectedTravelClasses.includes(travelClass)) {
        this.selectedTravelClasses.push(travelClass)
      }
      console.log('Offer store add travelClass:', this.selectedTravelClasses)
    },
    removeTravelClass(travelClass: string) {
      this.selectedTravelClasses = this.selectedTravelClasses.filter((tc) => tc !== travelClass)
      console.log('Offer store remove travelClass:', this.selectedTravelClasses)
    },
    clearTravelClasses() {
      this.selectedTravelClasses = []
      console.log('Offer store clear travelClasses')
    },
    setOfferMode(offerMode: OfferMode | undefined) {
      this.selectedOfferMode = offerMode
    },
    unselectOffer() {
      this.selectedOffer = undefined
      this.selectedAncilleries = []
      this.selectedPlaceSelections = []
    },
    setError(error: OfferListError) {
      this.error = error
      this.offers = []
      this.loading = false
    },
  },
  getters: {
    totalPriceOfSelection(): string {
      if (this.selectedOffer && this.selectedOffer.offerSummary) {
        return displayPrice(
          extractPriceFromOffer(this.selectedOffer),
          this.selectedAncilleries.map((aa) => aa.price),
        )
      }
      return ''
    },
  },
})
