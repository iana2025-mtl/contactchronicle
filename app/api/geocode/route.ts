import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json(
      { error: 'City parameter is required' },
      { status: 400 }
    );
  }

  try {
    const encodedCity = encodeURIComponent(city);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedCity}&format=json&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ContactChronicle/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Geocoding failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { error: 'Invalid coordinates returned' },
          { status: 500 }
        );
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: 'Coordinates out of range' },
          { status: 500 }
        );
      }

      const displayName = result.display_name?.split(',')[0] || city;
      
      return NextResponse.json({
        lat,
        lng,
        displayName,
      });
    } else {
      return NextResponse.json(
        { error: 'No results found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

