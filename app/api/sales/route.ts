import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { posId, posNumber, items, total } = await request.json();

    if (!posId || !items || !total) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const { data: sale, error } = await supabaseAdmin
      .from('sales')
      .insert([{ pos_id: posId, pos_number: posNumber, total, items }])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al crear la venta' },
        { status: 500 }
      );
    }

    return NextResponse.json(sale, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const posId = request.nextUrl.searchParams.get('posId');

    if (!posId) {
      return NextResponse.json(
        { error: 'posId es requerido' },
        { status: 400 }
      );
    }

    const { data: sales, error } = await supabaseAdmin
      .from('sales')
      .select('*')
      .eq('pos_id', posId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener ventas' },
        { status: 500 }
      );
    }

    return NextResponse.json(sales);
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
