#!/bin/bash
sed -i "/where('vehicleType', '==', driverVehicleType),/d" src/App.tsx
sed -i "s/if (data.rejectedBy !== driverId) {/if (data.vehicleType \&\& data.vehicleType !== driverVehicleType) return;\n        if (data.rejectedBy !== driverId) {/" src/App.tsx
