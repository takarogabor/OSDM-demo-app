import { defineStore } from 'pinia'
import type { components } from '@/schemas/schema'

// ToDo: The passenger definition should be split from an anonymous passenger definition
export const usePassengerStore = defineStore('passenger', {
  state: (): {
    passengers: components['schemas']['Passenger'][]
  } => {
    return {
    passengers: [
      {
        id: '',
        externalRef: 'passenger_01',
        dateOfBirth: null,
        age: 27,
        type: 'PERSON',
      },
    ],
  }},
  actions: {
    definePassengers(passengers: components['schemas']['Passenger'][]) {
      this.passengers = passengers
    },
    setPassengerDetails(index: number, passenger: components['schemas']['Passenger']) {
      this.passengers[index] = passenger
    },
    addPassenger(passenger: components['schemas']['Passenger']) {
      this.passengers.push(passenger)
    },
    removePassenger(index: number) {
      this.passengers = this.passengers.filter((_, i) => i != index)
    },
  },
})
