# Daily Monitoring Checklist

*Quick reference for daily Booksphere system monitoring*

## ☀️ **Daily Tasks (5 minutes)**

### **Step 1: System Health Check** (2 minutes)
```sql
SELECT * FROM run_system_health_check();
```
**✅ Expected**: All components show `HEALTHY` status

### **Step 2: Cataloging Performance** (1 minute)
```sql
SELECT * FROM get_cataloging_performance_metrics();
```
**✅ Expected**: 
- Low failed jobs (<5% of total)
- Reasonable active jobs (0-10)
- Growing index scans

### **Step 3: Quick Inventory Check** (2 minutes)
```sql
SELECT * FROM inventory_search_performance 
WHERE usage_level = 'HIGH' 
ORDER BY scans DESC 
LIMIT 5;
```
**✅ Expected**: High-usage indexes showing activity

---

## 🚨 **Red Flags - Take Action**

- ❌ Any component shows `NEEDS_ATTENTION`
- ❌ Failed jobs >10% of total
- ❌ Active jobs stuck >50 for multiple days
- ❌ Zero index scans (system not being used)
- ❌ Dramatic drops in data volume

---

## 📞 **When to Get Help**

**Immediate action needed if:**
- Multiple components show `NEEDS_ATTENTION`
- Failed job rate >20%
- System showing `CRITICAL` status

**Include in support request:**
- All monitoring query results
- When issues started
- Recent changes/deployments

---

## 📊 **Current Baselines**
- Stock Items: ~41,000
- Editions: ~39,000
- Books: ~38,000
- Cataloging Indexes: 7
- Inventory Indexes: 17+

*Updated: January 15, 2025* 