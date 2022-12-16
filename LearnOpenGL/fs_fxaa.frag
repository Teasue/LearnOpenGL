#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;

float _MinThreshold = 0.0312;
float _Threshold = 0.125;

float GetLuma(vec3 color)
{
    return color.x * 0.213 + color.y * 0.715 + color.z * 0.072;
};

void main()
{ 
    vec2 texsize = textureSize(screenTexture, 0);
    vec2 uvstep = vec2(1.0 / texsize.x, 1.0 / texsize.y);

    float N = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(0.0, 1.0)).rgb);
    float S = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(0.0, -1.0)).rgb);
    float E = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(1.0, 0.0)).rgb);
    float W = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(-1.0, 0.0)).rgb);
    
    float M = GetLuma(texture(screenTexture, TexCoords).rgb);

    float MaxLuma = max(M, max(max(N, S), max(E, W)));
    float MinLuma = min(M, min(min(N, S), min(E, W)));

    float Contrast = MaxLuma - MinLuma;
    if (Contrast >= max(_MinThreshold, MaxLuma * _Threshold))
    {
        float NW = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(-1.0, 1.0)).rgb);
        float SW = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(-1.0, -1.0)).rgb);
        float SE = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(1.0, -1.0)).rgb);
        float NE = GetLuma(texture(screenTexture, TexCoords + uvstep * vec2(1.0, 1.0)).rgb);

        float Filter = 2 * (N + E + S + W) + NE + NW + SE + SW;
        Filter = Filter / 12;
        Filter = abs(Filter -  M);
        Filter = max(Filter / Contrast, 0);
        Filter = min(Filter / Contrast, 1);
        float PixelBlend = smoothstep(0, 1, Filter);
        PixelBlend = PixelBlend * PixelBlend;

        float Vertical = abs(N + S - 2 * M) * 2+ abs(NE + SE - 2 * E) + abs(NW + SW - 2 * W);
        float Horizontal = abs(E + W - 2 * M) * 2 + abs(NE + NW - 2 * N) + abs(SE + SW - 2 * S);
        bool IsHorizontal = Vertical > Horizontal;
        vec2 PixelStep = IsHorizontal ? vec2(0, uvstep.y) : vec2(uvstep.x, 0);
        vec2 EdgeStep = IsHorizontal ? vec2(uvstep.x, 0) : vec2(0, uvstep.y);

        float Positive = abs((IsHorizontal ? N : E) - M);
        float Negative = abs((IsHorizontal ? S : W) - M);
        bool IsNegative = Positive < Negative;
        if (IsNegative) 
            PixelStep = -PixelStep;

        float OppositeM;
        if (IsHorizontal)
            OppositeM = IsNegative ? S : N;
        else
            OppositeM = IsNegative ? W : E;

        float Gradient = IsNegative ? Negative : Positive;
        float EdgeLuma = (M + OppositeM) * 0.5;
        float GradientThreshold = Gradient * 0.25;
        vec2 EdgePixel = TexCoords + PixelStep * 0.5;
        float NextPixelLumaDelta, EdgePositiveDistance, EdgeNegativeDistance;
        int i;
        for (i = 1; i <= 10; i++)
        {
            NextPixelLumaDelta = GetLuma(texture(screenTexture, EdgePixel + i * EdgeStep).rgb) - EdgeLuma;
            if (abs(NextPixelLumaDelta) > GradientThreshold)
            {
                EdgePositiveDistance = i * (IsHorizontal ? EdgeStep.x : EdgeStep.y);
                break;
            }
        }

        if (i == 11)
        {
            EdgePositiveDistance = 10 * (IsHorizontal ? EdgeStep.x : EdgeStep.y);
        }

        for (i = 1; i <= 10; i++)
        {
             NextPixelLumaDelta = GetLuma(texture(screenTexture, EdgePixel - i * EdgeStep).rgb) - EdgeLuma;
            if (abs(NextPixelLumaDelta) > GradientThreshold)
            {
                EdgeNegativeDistance = i * (IsHorizontal ? EdgeStep.x : EdgeStep.y);
                break;
            }
        }

        if (i == 11)
        {
            EdgeNegativeDistance = 10 * (IsHorizontal ? EdgeStep.x : EdgeStep.y);
        }

        float EdgeBlend;
        if (EdgePositiveDistance < EdgeNegativeDistance)
        {
            if (sign(NextPixelLumaDelta) == sign(M - EdgeLuma))
                EdgeBlend = 0;
            else
                EdgeBlend = 0.5 - EdgePositiveDistance / (EdgePositiveDistance + EdgeNegativeDistance);
        }
        else
        {
            if (sign(NextPixelLumaDelta) == sign(M - EdgeLuma))
                EdgeBlend = 0;
            else
                EdgeBlend = 0.5 - EdgeNegativeDistance / (EdgePositiveDistance + EdgeNegativeDistance);
        }

        float FinalBlend = max(PixelBlend, EdgeBlend);

        FragColor = texture(screenTexture, TexCoords + PixelStep * FinalBlend);
    }
    else
    {
        FragColor = texture(screenTexture, TexCoords);
    }
}