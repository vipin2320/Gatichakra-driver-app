#!/bin/bash
sed -i "s/rideStatus: 'searching',/rideStatus: 'searching',\n      vehicleType: driverVehicleType,/" src/App.tsx
