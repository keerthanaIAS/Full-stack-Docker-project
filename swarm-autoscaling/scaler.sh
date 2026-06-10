#!/bin/sh
echo "=== CPU AutoScaler Started ==="
SCALE_UP=30
SCALE_DOWN=5
MIN=2
MAX=8
COOLDOWN=20
LAST_SCALE=0
docker service scale myapp_web-app=2 2>/dev/null
while true; do
  NOW=$(date +%s)
  TOTAL_CPU=0
  CPU_COUNT=0
  for CID in $(docker ps -q --filter name=myapp_web-app); do
    CPU_RAW=$(docker stats --no-stream --format '{{.CPUPerc}}' $CID 2>/dev/null)
    CPU_VAL=$(echo "$CPU_RAW" | sed 's/%//')
    if [ -n "$CPU_VAL" ]; then
      TOTAL_CPU=$(echo "$TOTAL_CPU + $CPU_VAL" | bc 2>/dev/null)
      CPU_COUNT=$((CPU_COUNT + 1))
    fi
  done
  if [ "$CPU_COUNT" -gt 0 ]; then
    AVG_CPU=$(echo "scale=1; $TOTAL_CPU / $CPU_COUNT" | bc 2>/dev/null)
  else
    AVG_CPU=0
  fi
  CUR=$(docker service inspect myapp_web-app --format '{{.Spec.Mode.Replicated.Replicas}}' 2>/dev/null)
  if [ -z "$CUR" ]; then CUR=2; fi
  TIME_SINCE=$((NOW - LAST_SCALE))
  echo "[Replicas: $CUR | CPU: ${AVG_CPU}% | Cooldown: ${TIME_SINCE}s]"
  HIGH=$(echo "$AVG_CPU > $SCALE_UP" | bc 2>/dev/null)
  LOW=$(echo "$AVG_CPU < $SCALE_DOWN" | bc 2>/dev/null)
  if [ "$HIGH" = "1" ] && [ "$CUR" -lt "$MAX" ] && [ "$TIME_SINCE" -gt "$COOLDOWN" ]; then
    NEW=$((CUR + 1))
    docker service scale myapp_web-app=$NEW
    echo ">>> SCALE UP -> $NEW <<<"
    LAST_SCALE=$NOW
  elif [ "$LOW" = "1" ] && [ "$CUR" -gt "$MIN" ] && [ "$TIME_SINCE" -gt "$COOLDOWN" ]; then
    NEW=$((CUR - 1))
    docker service scale myapp_web-app=$NEW
    echo ">>> SCALE DOWN -> $NEW <<<"
    LAST_SCALE=$NOW
  else
    echo "No scaling needed"
  fi
  sleep 10
done
