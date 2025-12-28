import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { data, error } = await supabaseAdmin
      .from('egresos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Egreso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    console.log(`Updating expense ${id}`);
    const body = await request.json();
    console.log('Update body:', JSON.stringify(body));
    
    const updateData: Record<string, unknown> = {};

    if ('status' in body) {
      updateData.status = body.status;
    }
    if ('payment_status' in body) {
      updateData.payment_status = body.payment_status;
    }
    if ('check_date' in body) {
      updateData.check_date = body.check_date;
    }
    if ('category' in body) {
      updateData.category = body.category;
    }
    if ('items' in body) {
      updateData.items = body.items;
    }
    if ('subtotal' in body) {
      updateData.subtotal = body.subtotal;
    }
    if ('shipping_cost' in body) {
      updateData.shipping_cost = body.shipping_cost;
    }
    if ('total' in body) {
      updateData.total = body.total;
    }
    if ('notes' in body) {
      updateData.notes = body.notes;
    }

    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No hay datos para actualizar' },
        { status: 400 }
      );
    }

    console.log('Update data to save:', JSON.stringify(updateData));

    const { data, error } = await supabaseAdmin
      .from('egresos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: `Error al actualizar: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Expense updated successfully:', data.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error interno: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { error } = await supabaseAdmin
      .from('egresos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Error al eliminar el egreso' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
