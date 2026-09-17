import { sql } from "../../../lib/db";

export async function GET() {

  try {

    const rows = await sql`

      SELECT *

      FROM queue

      ORDER BY id DESC

    `;

    return Response.json(rows);

  } catch (error) {

    console.error("GET /api/queue failed:", error);

    return Response.json(

      { error: "Failed to load queue" },

      { status: 500 }

    );

  }

}

export async function POST(request) {

  try {

    const { title, type, year, service, addedBy } =

      await request.json();

    const rows = await sql`

      INSERT INTO queue (title, type, year, service, added_by)

      VALUES (${title}, ${type}, ${year}, ${service}, ${addedBy})

      RETURNING *

    `;

    return Response.json(rows[0], { status: 201 });

  } catch (error) {

    console.error("POST /api/queue failed:", error);

    return Response.json(

      { error: "Failed to add queue item" },

      { status: 500 }

    );

  }

}
