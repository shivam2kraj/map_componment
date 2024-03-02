import React, { useRef, useEffect, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Draw } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';

const MapComponent = () => {
  const mapRef = useRef(null);
  const drawLayer = useRef(null); // Ref for draw layer
  const [drawType, setDrawType] = useState('Point');
  const [measurements, setMeasurements] = useState([]);
  const [pinpoint, setPinpoint] = useState(null);

  // Function to clear drawings and measurements
  const clearDrawings = () => {
    const drawSource = drawLayer.current.getSource();
    drawSource.clear();
    setMeasurements([]);
  };

  useEffect(() => {
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    const drawSource = new VectorSource();
    drawLayer.current = new VectorLayer({ // Assign to drawLayer ref
      source: drawSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });

    map.addLayer(drawLayer.current);

    let draw;
    const createDrawInteraction = () => {
      draw = new Draw({
        source: drawSource,
        type: drawType,
      });

      draw.on('drawend', (event) => {
        const geometry = event.feature.getGeometry();
        let measurement;
        if (geometry.getType() === 'Polygon') {
          measurement = getArea(geometry);
        } else if (geometry.getType() === 'LineString') {
          measurement = getLength(geometry);
        }
        setMeasurements([...measurements, measurement]);
      });

      map.addInteraction(draw);
    };

    createDrawInteraction();

    map.on('click', (event) => {
      setPinpoint(event.coordinate);
    });

    return () => {
      map.setTarget(null);
      map.removeInteraction(draw);
    };
  }, [drawType]); // Add drawType to the dependency array

  const handleDrawTypeChange = (type) => {
    setDrawType(type);
  };

  return (
    <div>
      <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
      <div>
        <h2>Drawings:</h2>
        <div>
          <button onClick={() => handleDrawTypeChange('Point')}>Draw Point</button>
          <button onClick={() => handleDrawTypeChange('LineString')}>Draw Line</button>
          <button onClick={() => handleDrawTypeChange('Polygon')}>Draw Polygon</button>
          <button onClick={() => clearDrawings()}>Clear Drawings</button> {/* Add clear drawings button */}
        </div>
        <ul>
          {measurements.map((measurement, index) => (

            <li key={index}>Measurement: {measurement ? measurement.toFixed(2) : 'N/A'}</li>
          ))}
        </ul>
      </div>
      {pinpoint && (
        <div>
          <h2>Pinpoint Location:</h2>
          <p>Latitude: {pinpoint[1].toFixed(6)}</p>
          <p>Longitude: {pinpoint[0].toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
