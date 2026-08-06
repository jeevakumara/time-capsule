import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";

function MapClickHandler({ onChange }) {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            onChange({ latitude: lat, longitude: lng });
        },
    });
    return null;
}

function LocationPickerMap({ latitude, longitude, radiusMeters, onChange }) {
    const defaultCenter = [12.9481, 80.1397]; // MIT default center
    const center =
        latitude != null && longitude != null
            ? [Number(latitude), Number(longitude)]
            : defaultCenter;

    const radius = radiusMeters ? Number(radiusMeters) : 100;

    return (
        <MapContainer
            center={center}
            zoom={17}
            style={{ height: "300px", width: "100%", marginBottom: "1rem" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Handle clicks and update parent state */}
            <MapClickHandler onChange={onChange} />

            {/* Show marker and circle only when coordinates are selected */}
            {latitude != null && longitude != null && (
                <>
                    <Marker position={[Number(latitude), Number(longitude)]} />
                    <Circle
                        center={[Number(latitude), Number(longitude)]}
                        radius={radius}
                        pathOptions={{ color: "blue", fillColor: "#3f8efc", fillOpacity: 0.2 }}
                    />
                </>
            )}
        </MapContainer>
    );
}

export default LocationPickerMap;