#!/bin/bash
sed -i '/if (data.vehicleType \&\& data.vehicleType !== driverVehicleType) return;/d' src/App.tsx
sed -i "/if (\!data.vehicleType \&\& driverVehicleType \!== 'City Cab') return;/d" src/App.tsx
