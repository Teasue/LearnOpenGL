#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform sampler2D windowTexture;
uniform bool useTexture;
uniform bool firstDraw;

void main()
{
	if (useTexture)
	{
		if (firstDraw)
		{
			FragColor = texture(windowTexture, TexCoords);
		}
		else
		{
			vec4 historyColor = texture(screenTexture, TexCoords);
			vec4 currentColor = texture(windowTexture, TexCoords);
			FragColor = historyColor * 0.95 + currentColor * 0.05;
		}
	}
	else
	{
		FragColor = texture(windowTexture, TexCoords);
	}
}