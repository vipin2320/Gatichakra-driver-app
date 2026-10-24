#!/bin/bash
# 1. Add driverVehicleType state
sed -i '55a\
  const [driverVehicleType, setDriverVehicleType] = useState<string>("City Cab");' src/App.tsx

# 2. Update state inside driver listener
sed -i 's/setIsBlocked(false);/setIsBlocked(false);\n          if (data.vehicleType) {\n            setDriverVehicleType(data.vehicleType);\n          }/' src/App.tsx

# 3. Add filter in rides query
sed -i "s/where('rideStatus', '==', 'searching'),/where('rideStatus', '==', 'searching'),\n      where('vehicleType', '==', driverVehicleType),/" src/App.tsx

# 4. Add driverVehicleType to dependency array
sed -i 's/\[isOnline, acceptedRide, incomingRide, isBlocked\]/\[isOnline, acceptedRide, incomingRide, isBlocked, driverVehicleType\]/' src/App.tsx
