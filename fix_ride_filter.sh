#!/bin/bash
sed -i "s/if (data.vehicleType \&\& data.vehicleType !== driverVehicleType) return;/if (data.vehicleType \&\& data.vehicleType !== driverVehicleType) return;\n        if (!data.vehicleType \&\& driverVehicleType !== 'City Cab') return;/" src/App.tsx
