import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const audio = Buffer.from(await req.arrayBuffer());

    const key = process.env.ACRCLOUD_KEY;
    const secret = process.env.ACRCLOUD_SECRET;

    const timestamp = Math.floor(Date.now() / 1000);

    const stringToSign =
      `POST\n/v1/identify\n${key}\naudio\n1\n${timestamp}`;

    const signature = crypto
      .createHmac("sha1", secret)
      .update(stringToSign)
      .digest("base64");

    const form = new FormData();
    form.append("sample", audio);
    form.append("access_key", key);
    form.append("data_type", "audio");
    form.append("signature", signature);
    form.append("timestamp", timestamp);

    const response = await fetch(
      "https://identify-eu-west-1.acrcloud.com/v1/identify",
      { method: "POST", body: form }
    );

    const json = await response.json();

    if (!json.metadata) {
      return res.status(200).json({ result: null });
    }

    const m = json.metadata.music[0];

    res.json({
      result: {
        title: m.title,
        artist: m.artists[0].name,
        image: m.album?.coverart
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}