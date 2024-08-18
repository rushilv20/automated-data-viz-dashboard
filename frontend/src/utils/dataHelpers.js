export const parseDate = dateString => {
    const [month, day, year] = dateString.split('/');
    return new Date(`20${year}`, month - 1, day);
};

export const consolidateFlights = (flights, invoices) => {
    console.log('Invoices:', invoices);
    console.log('Flights:', flights);

    const flightData = {};

    if (!invoices || !flights) {
        console.error('Invoices or Flights data is missing');
        return flightData; // return empty object to avoid further issues
    }

    const invoicedTrips = new Set(
        invoices
            .map(invoice => invoice.Trip)
            .filter(trip => invoices.some(invoice => invoice.Trip === trip && invoice.Status === 'Invoiced'))
    );

    console.log('Invoiced Trips:', invoicedTrips);

    flights.forEach(flight => {
        if (!invoicedTrips.has(flight.Trip)) return;

        const dateKey = parseDate(flight['Start Z']).toISOString().slice(0, 10); // Convert date to YYYY-MM-DD format
        if (!flightData[flight.Trip]) {
            flightData[flight.Trip] = {
                Aircraft: flight.Aircraft,
                TotalFlightHrs: 0,
                Dates: {}
            };
        }
        flightData[flight.Trip].TotalFlightHrs += parseFloat(flight['Flight hrs']);
        if (!flightData[flight.Trip].Dates[dateKey]) {
            flightData[flight.Trip].Dates[dateKey] = {
                Trip: flight.Trip,
                FlightHrs: parseFloat(flight['Flight hrs']),
                Price: 0 // Initialize price, to be updated from invoices
            };
        } else {
            flightData[flight.Trip].Dates[dateKey].FlightHrs += parseFloat(flight['Flight hrs']);
        }
    });

    console.log('Consolidated Flight Data:', flightData);

    return flightData;
};


export const matchInvoices = (flights, invoices) => {
    invoices.forEach(invoice => {
        if (invoice.Status === 'Invoiced') {
            const flight = flights[invoice.Trip];
            if (flight) {
                // Calculate total flight hours for the trip
                const totalFlightHrs = flight.TotalFlightHrs;
                // Distribute price proportionally to each date
                Object.keys(flight.Dates).forEach(date => {
                    const dateData = flight.Dates[date];
                    const proportion = dateData.FlightHrs / totalFlightHrs;
                    dateData.Price += proportion * parseFloat(invoice.Price);
                });
            }
        }
    });
};

export const organizeDataByAircraft = flights => {
    const aircraftData = {};
    Object.values(flights).forEach(flight => {
        const { Aircraft, Dates } = flight;
        if (!aircraftData[Aircraft]) {
            aircraftData[Aircraft] = {};
        }
        Object.entries(Dates).forEach(([date, data]) => {
            if (data.FlightHrs > 0 && !isNaN(data.FlightHrs) && data.Price > 0 && !isNaN(data.Price)) {
                if (!aircraftData[Aircraft][date]) {
                    aircraftData[Aircraft][date] = data;
                } else {
                    aircraftData[Aircraft][date].FlightHrs += data.FlightHrs;
                    aircraftData[Aircraft][date].Price += data.Price;
                }
            }
        });
    });
    return aircraftData;
};
