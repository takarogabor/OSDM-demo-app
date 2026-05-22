<template>
  <div class="h-full bg-osdm-bg-secondary mt-1 flex flex-col items-center p-4 gap-4">
    <sbb-card v-if="booking" class="max-w-[500px] w-1/2">
      <h1 class="text-2xl font-bold mb-4">Overview</h1>

      <div class="mb-4">
        <h2 class="text-xl font-semibold">Booking ID: {{ booking.id }}</h2>
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-semibold">Passenger Details</h3>
        <div
          class="list-disc pl-5"
          v-for="passenger in booking.passengers"
          :key="`pas-${passenger.id}`"
        >
          <ul v-if="passenger.detail">
            <li>{{ passenger.detail.firstName }} {{ passenger.detail.lastName }}</li>
            <li v-if="passenger.detail.email">Email: {{ passenger.detail.email }}</li>
            <li v-if="passenger.detail.phoneNumber">Phone: {{ passenger.detail.phoneNumber }}</li>
            <li v-if="passenger.age">Age: {{ passenger.age }}</li>
          </ul>
        </div>
      </div>

      <div class="mb-4" v-if="booking.confirmedPrice">
        <h3 class="text-lg font-semibold">Price Overview</h3>
        <p class="font-bold">
          {{ displayPrice(booking.confirmedPrice) }}
        </p>
      </div>

      <div class="flex gap-3 mt-4">
        <button
          type="button"
          class="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
          :disabled="cleanupLoading || !booking?.id"
          @click="cleanupBooking"
        >
          {{ cleanupLoading ? 'Cleaning up...' : 'Cleanup booking' }}
        </button>
      </div>
    </sbb-card>
    <sbb-card
      class="max-w-[500px] w-1/2"
      v-for="fulfillment in booking?.fulfillments"
      :key="`ful-${fulfillment.id}`"
    >
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between mb-2">
          <span>Control Number: {{ fulfillment.controlNumber }}</span>
          <sbb-button icon-name="chevron-right-small"
              @click="getFulfillment(fulfillment.id)">Fetch documents</sbb-button>
        </div>
        <div
          v-for="(fulfillmentDocument, index) in fulfillment.fulfillmentDocuments"
          :key="`ful-doc-${fulfillment.id}-${index}`"
          class="flex flex-col gap-2"
        >
          <sbb-button
            v-if="fulfillmentDocument.downloadLink"
            size="s"
            icon-name="download-small"
            @click="downloadDocument(fulfillmentDocument)">
            Download Ticket ({{ fulfillmentDocument.medium }})
          </sbb-button>
          <img
            v-if="
              fulfillmentDocument.downloadLink?.endsWith('.png') &&
              documentBlobUrls[fulfillmentDocument.downloadLink]
            "
            :src="documentBlobUrls[fulfillmentDocument.downloadLink]"
            class="self-center m-4"
          />
          <sbb-loading-indicator
            v-else-if="fulfillment.status == 'ON_HOLD'"
            variant="circle"
            size="s"
            color="white"
            class="self-center m-4"
          ></sbb-loading-indicator>
        </div>
      </div>
    </sbb-card>
    <RouterLink
      v-if="booking?.id"
      :to="`/refund-offers/${booking.id}`"
      custom
      v-slot="{ navigate }"
    >
      <sbb-button icon-name="chevron-right-small" @click="navigate"> Request refund </sbb-button>
    </RouterLink>
  </div>
</template>

<script lang="ts">
import { inject, onBeforeUnmount, ref } from 'vue'
import { displayPrice } from '@/helpers/price'
import { useBookingStore } from '@/stores/booking'
import { osdmClientKey } from '@/types/symbols'
import type { components } from '@/schemas/schema'
import { SbbCardElement as SbbCard } from '@sbb-esta/lyne-elements/card'

export default {
  components: { SbbCard },
  computed: {
    booking() {
      return useBookingStore().booking
    },
  },
  setup() {
    const OSDM = inject(osdmClientKey)
    const cleanupLoading = ref(false)
    const documentBlobUrls = ref<Record<string, string>>({})

    const cleanupBooking = async () => {
      const bookingId = useBookingStore().booking?.id
      if (!bookingId || cleanupLoading.value) {
        return
      }

      cleanupLoading.value = true
      try {
        await OSDM?.booking.cleanupBooking(bookingId, { overruleCode: '' })
      } catch (error) {
        console.error('Cleanup booking failed', error)
      } finally {
        cleanupLoading.value = false
      }
    }

    const getFulfillment = async (fulfillmentId: string) => {
      try {
        await OSDM?.booking.getFulfillment(fulfillmentId)
      } catch (error) {
        console.error('Get fulfillment failed', error)
      }
    }

    const downloadDocument = async (fulfillmentDocument: components['schemas']['FulfillmentDocument']) => {
      const url = fulfillmentDocument?.downloadLink
      if (!url) return

      // If already downloaded, just open the cached blob URL
      if (documentBlobUrls.value[url]) {
        window.open(documentBlobUrls.value[url], '_blank')
        return
      }

      try {
        const result = await OSDM?.booking.downloadFulfillmentDocument(url)

        if (!result || result.error) {
          throw new Error(`Failed to download document (${result?.error?.status ?? 'unknown status'})`)
        }

        const blob = result.data as Blob
        const objectUrl = URL.createObjectURL(blob)
        documentBlobUrls.value[url] = objectUrl
        window.open(objectUrl, '_blank')
      } catch (error) {
        console.error('Document download failed', error)
      }
    }

    onBeforeUnmount(() => {
      Object.values(documentBlobUrls.value).forEach((blobUrl) => URL.revokeObjectURL(blobUrl))
    })

    return {
      cleanupBooking,
      cleanupLoading,
      displayPrice,
      getFulfillment,
      downloadDocument,
      documentBlobUrls,
    }
  },
}
</script>
