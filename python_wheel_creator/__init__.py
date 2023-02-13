from .hive import registerHive

def registerHive(spark, database, table, location):
   cmd = f"CREATE TABLE IF NOT EXISTS {database}.{table} USING PARQUET LOCATION '{location}'"
   spark.sql(cmd)
   print(f"Executed: {cmd}")